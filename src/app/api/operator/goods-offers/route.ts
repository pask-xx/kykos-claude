import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hasAnyPermission } from '@/lib/permissions';
import { generateDeliverQrCode, generateAndUploadQrCodeWithLogo } from '@/lib/qrcode';
import { sendGoodsDeliveryQrNotification } from '@/lib/email';
import { NotificationType, RecipientType } from '@prisma/client';
import { getJwtSecret } from '@/lib/auth';

const JWT_SECRET = getJwtSecret();

interface OperatorSession {
  operatorId: string;
  organizationId: string;
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

export async function GET() {
  try {
    const session = await getOperatorSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const operator = await prisma.operator.findUnique({
      where: { id: session.operatorId },
    });

    if (!operator || !operator.active) {
      return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
    }

    if (!hasAnyPermission(operator.role, operator.permissions, ['OBJECT_RECEIVE', 'OBJECT_DELIVER', 'RECIPIENT_AUTHORIZE'])) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    // Get goods offers that are ACCEPTED (donor delivered to org, waiting for pickup)
    // These are linked to GoodsRequests where intermediaryId is the operator's org
    const offers = await prisma.goodsOffer.findMany({
      where: {
        request: {
          intermediaryId: session.organizationId,
          status: 'DELIVERED',
        },
      },
      include: {
        offeredBy: {
          select: { id: true, nickname: true, name: true, email: true },
        },
        request: {
          select: {
            id: true,
            title: true,
            category: true,
            beneficiary: {
              select: { id: true, nickname: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ offers });
  } catch (error) {
    console.error('Operator goods offers GET error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getOperatorSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const operator = await prisma.operator.findUnique({
      where: { id: session.operatorId },
    });

    if (!operator || !operator.active) {
      return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
    }

    if (!hasAnyPermission(operator.role, operator.permissions, ['OBJECT_RECEIVE', 'RECIPIENT_AUTHORIZE'])) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const { offerId, action } = await request.json();

    if (!offerId || !action) {
      return NextResponse.json({ error: 'offerId e action sono obbligatori' }, { status: 400 });
    }

    const offer = await prisma.goodsOffer.findUnique({
      where: { id: offerId },
      include: {
        offeredBy: { select: { id: true, name: true, email: true } },
        request: {
          select: { intermediaryId: true, beneficiaryId: true },
        },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Offerta non trovata' }, { status: 404 });
    }

    if (offer.request.intermediaryId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    if (action === 'accept') {
      // Fetch full data for email
      const goodsRequest = await prisma.goodsRequest.findUnique({
        where: { id: offer.requestId },
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

      await prisma.$transaction(async (tx) => {
        await tx.goodsOffer.update({
          where: { id: offerId },
          data: { status: 'ACCEPTED' },
        });

        await tx.goodsRequest.update({
          where: { id: offer.requestId },
          data: {
            status: 'FULFILLED',
            fulfilledById: offer.offeredById,
            fulfilledAt: new Date(),
          },
        });
      });

      // Send delivery QR code email to donor
      try {
        const deliverQrData = generateDeliverQrCode(offer.requestId, offer.offeredById, 'goods');
        const deliverQrImage = await generateAndUploadQrCodeWithLogo(deliverQrData, `goods-deliver-${offer.requestId}.png`);

        await sendGoodsDeliveryQrNotification(
          offer.offeredBy.email,
          offer.offeredById,
          offer.offeredBy.name,
          goodsRequest?.title || 'Richiesta',
          offer.requestId,
          deliverQrData,
          deliverQrImage,
          goodsRequest?.intermediary.name || '',
          goodsRequest?.intermediary.address ?? null,
          goodsRequest?.intermediary.houseNumber ?? null,
          goodsRequest?.intermediary.cap ?? null,
          goodsRequest?.intermediary.city ?? null,
          goodsRequest?.intermediary.province ?? null,
          goodsRequest?.intermediary.phone ?? null,
          goodsRequest?.intermediary.email ?? null,
          goodsRequest?.intermediary.hoursInfo ?? null
        );
      } catch (emailError) {
        console.error('Error sending delivery QR email:', emailError);
      }

      // Notify donor in-app
      await prisma.notification.create({
        data: {
          recipientUserId: offer.offeredById,
          recipientType: RecipientType.USER,
          title: 'Offerta accettata!',
          message: `La tua offerta è stata accettata. Ricevi il QR code per la consegna.`,
          type: NotificationType.GOODS_OFFER_RECEIVED,
          link: `/donor/qr-goods/${offer.requestId}`,
        },
      });

    } else if (action === 'reject') {
      await prisma.goodsOffer.update({
        where: { id: offerId },
        data: { status: 'REJECTED' },
      });
    } else {
      return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Operator goods offers PATCH error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}