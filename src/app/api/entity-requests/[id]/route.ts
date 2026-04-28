import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { NotificationType, RecipientType } from '@prisma/client';
import { hasPermission, hasAnyPermission } from '@/lib/permissions';
import { generateAndUploadQrCode, generateDeliverQrCode } from '@/lib/qrcode';
import { sendGoodsDeliveryQrNotification } from '@/lib/email';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

interface OperatorSession {
  operatorId: string;
  organizationId: string;
  role: string;
}

interface UserSession {
  userId: string;
  role: string;
}

async function getOperatorSession(): Promise<OperatorSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('operator_session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as OperatorSession;
  } catch {
    return null;
  }
}

async function getUserSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserSession;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');

    if (!requestId) {
      return NextResponse.json({ error: 'ID richiesta mancante' }, { status: 400 });
    }

    const goodsRequest = await prisma.goodsRequest.findUnique({
      where: { id: requestId },
      include: {
        beneficiary: {
          select: { id: true, name: true, firstName: true, lastName: true, email: true },
        },
        intermediary: {
          select: { id: true, name: true, address: true, houseNumber: true, cap: true, city: true, province: true, phone: true, email: true, hoursInfo: true },
        },
        fulfilledBy: {
          select: { id: true, name: true, email: true },
        },
        offers: {
          include: {
            offeredBy: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!goodsRequest) {
      return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
    }

    return NextResponse.json({ goodsRequest });
  } catch (error) {
    console.error('Goods request GET error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const operatorSession = await getOperatorSession();
    const userSession = await getUserSession();

    if (!operatorSession && !userSession) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { requestId, action } = await request.json();

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    const goodsRequest = await prisma.goodsRequest.findUnique({
      where: { id: requestId },
      include: {
        beneficiary: { select: { id: true, name: true, email: true } },
        intermediary: { select: { id: true, name: true } },
      },
    });

    if (!goodsRequest) {
      return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
    }

    // Handle operator actions
    if (operatorSession && action === 'approve') {
      // Verify organization match
      if (goodsRequest.intermediaryId !== operatorSession.organizationId) {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
      }

      const operator = await prisma.operator.findUnique({
        where: { id: operatorSession.operatorId },
      });

      if (!operator || !hasAnyPermission(operator.role, operator.permissions, ['RECIPIENT_AUTHORIZE'])) {
        return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
      }

      await prisma.goodsRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      });

      // Notify beneficiary
      await prisma.notification.create({
        data: {
          recipientUserId: goodsRequest.beneficiaryId,
          recipientType: RecipientType.USER,
          title: 'Richiesta approvata!',
          message: `La tua richiesta "${goodsRequest.title}" è stata approvata dall'ente.`,
          type: NotificationType.GOODS_REQUEST_APPROVED,
          link: `/recipient/requests-entity/requests/${requestId}`,
        },
      });

      return NextResponse.json({ success: true, message: 'Richiesta approvata' });
    }

    if (operatorSession && action === 'reject') {
      if (goodsRequest.intermediaryId !== operatorSession.organizationId) {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
      }

      const operator = await prisma.operator.findUnique({
        where: { id: operatorSession.operatorId },
      });

      if (!operator || !hasAnyPermission(operator.role, operator.permissions, ['RECIPIENT_AUTHORIZE'])) {
        return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
      }

      await prisma.goodsRequest.update({
        where: { id: requestId },
        data: { status: 'CANCELLED' },
      });

      // Notify beneficiary
      await prisma.notification.create({
        data: {
          recipientUserId: goodsRequest.beneficiaryId,
          recipientType: RecipientType.USER,
          title: 'Richiesta rifiutata',
          message: `La tua richiesta "${goodsRequest.title}" è stata rifiutata dall'ente.`,
          type: NotificationType.GOODS_REQUEST_REJECTED,
          link: `/recipient/requests-entity/requests/${requestId}`,
        },
      });

      return NextResponse.json({ success: true, message: 'Richiesta rifiutata' });
    }

    // Handle user action: offer to fulfill
    if (userSession && action === 'offer') {
      const { message } = await request.json();

      // Check if request is available for offers
      if (goodsRequest.status !== 'APPROVED') {
        return NextResponse.json({ error: 'Richiesta non disponibile per offerte' }, { status: 400 });
      }

      if (goodsRequest.beneficiaryId === userSession.userId) {
        return NextResponse.json({ error: 'Non puoi offrire sulla tua stessa richiesta' }, { status: 400 });
      }

      if (goodsRequest.fulfilledById) {
        return NextResponse.json({ error: 'Richiesta già soddisfatta' }, { status: 400 });
      }

      // Create offer
      await prisma.goodsOffer.create({
        data: {
          requestId,
          offeredById: userSession.userId,
          message,
          status: 'PENDING',
        },
      });

      // Notify operators
      const operators = await prisma.operator.findMany({
        where: { organizationId: goodsRequest.intermediaryId },
      });

      for (const op of operators) {
        await prisma.notification.create({
          data: {
            recipientOperatorId: op.id,
            recipientType: RecipientType.OPERATOR,
            title: 'Nuova offerta per richiesta',
            message: `Qualcuno ha offerto di soddisfare la richiesta "${goodsRequest.title}"`,
            type: NotificationType.GOODS_OFFER_RECEIVED,
            link: `/operator/requests-entity/${requestId}`,
          },
        });
      }

      // Notify beneficiary
      await prisma.notification.create({
        data: {
          recipientUserId: goodsRequest.beneficiaryId,
          recipientType: RecipientType.USER,
          title: 'Nuova offerta per la tua richiesta',
          message: `Qualcuno ha offerto di soddisfare la tua richiesta "${goodsRequest.title}"`,
          type: NotificationType.GOODS_OFFER_RECEIVED,
          link: `/recipient/requests-entity/requests/${requestId}`,
        },
      });

      return NextResponse.json({ success: true, message: 'Offerta inviata' });
    }

    // Handle user action: accept offer (beneficiary or operator)
    if (userSession && action === 'accept_offer') {
      const { offerId } = await request.json();

      // First, get offer and goodsRequest data (needed for emails)
      const offerData = await prisma.goodsOffer.findUnique({
        where: { id: offerId },
        include: {
          offeredBy: { select: { id: true, name: true, email: true } },
        },
      });

      if (!offerData || offerData.requestId !== requestId) {
        return NextResponse.json({ error: 'Offerta non trovata' }, { status: 404 });
      }

      const goodsRequest = await prisma.goodsRequest.findUnique({
        where: { id: requestId },
        include: {
          beneficiary: { select: { id: true, name: true, email: true } },
          intermediary: {
            select: {
              name: true, address: true, houseNumber: true, cap: true,
              city: true, province: true, phone: true, email: true, hoursInfo: true
            },
          },
        },
      });

      if (!goodsRequest) {
        return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
      }

      // Accept offer - update request status
      await prisma.$transaction(async (tx) => {
        // Update request
        await tx.goodsRequest.update({
          where: { id: requestId },
          data: {
            status: 'FULFILLED',
            fulfilledById: offerData.offeredById,
            fulfilledAt: new Date(),
          },
        });

        // Update offer status
        await tx.goodsOffer.update({
          where: { id: offerId },
          data: { status: 'ACCEPTED' },
        });

        // Reject other offers
        await tx.goodsOffer.updateMany({
          where: {
            requestId,
            id: { not: offerId },
          },
          data: { status: 'REJECTED' },
        });
      });

      // Send delivery QR code email to fulfiller (donor)
      try {
        const deliverQrData = generateDeliverQrCode(requestId, offerData.offeredById);
        const deliverQrImage = await generateAndUploadQrCode(deliverQrData, `goods-deliver-${requestId}.png`);

        await sendGoodsDeliveryQrNotification(
          offerData.offeredBy.email,
          offerData.offeredById,
          offerData.offeredBy.name,
          goodsRequest.title,
          requestId,
          deliverQrData,
          deliverQrImage,
          goodsRequest.intermediary.name,
          goodsRequest.intermediary.address,
          goodsRequest.intermediary.houseNumber,
          goodsRequest.intermediary.cap,
          goodsRequest.intermediary.city,
          goodsRequest.intermediary.province,
          goodsRequest.intermediary.phone,
          goodsRequest.intermediary.email,
          goodsRequest.intermediary.hoursInfo
        );
      } catch (emailError) {
        console.error('Error sending delivery QR email:', emailError);
      }

      // Create in-app notification for fulfiller (donor) with QR link
      await prisma.notification.create({
        data: {
          recipientUserId: offerData.offeredById,
          recipientType: RecipientType.USER,
          title: 'Offerta accettata!',
          message: `La tua offerta per "${goodsRequest.title}" è stata accettata. Ricevi il QR code per la consegna.`,
          type: NotificationType.GOODS_OFFER_RECEIVED,
          link: `/donor/qr-goods/${requestId}`,
        },
      });

      // Create in-app notification for beneficiary (no QR link yet - they get it after delivery)
      await prisma.notification.create({
        data: {
          recipientUserId: goodsRequest.beneficiaryId,
          recipientType: RecipientType.USER,
          title: 'Disponibilità accettata!',
          message: `Un donatore ha accettato la tua richiesta di "${goodsRequest.title}". Ti avviseremo quando il bene sarà pronto per il ritiro.`,
          type: NotificationType.GOODS_OFFER_RECEIVED,
          link: `/recipient/requests-entity/requests/${requestId}`,
        },
      });

      return NextResponse.json({ success: true, message: 'Offerta accettata' });
    }

    return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
  } catch (error) {
    console.error('Goods request PATCH error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}