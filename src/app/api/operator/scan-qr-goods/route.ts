import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { parseQrCodeData, generatePickupQrCode, generateAndUploadQrCode } from '@/lib/qrcode';
import { sendGoodsPickupQrNotification } from '@/lib/email';
import { hasPermission } from '@/lib/permissions';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

interface OperatorSession {
  operatorId: string;
  organizationId: string;
  username: string;
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

export async function POST(request: Request) {
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

    if (!hasPermission(operator.role, operator.permissions, 'OBJECT_DELIVER')) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const { qrData, depositLocation, notes } = await request.json();

    if (!qrData || typeof qrData !== 'string') {
      return NextResponse.json({ error: 'QR data mancante o non valida' }, { status: 400 });
    }

    const parsed = parseQrCodeData(qrData);
    if (!parsed) {
      return NextResponse.json({ error: 'QR code non valido' }, { status: 400 });
    }

    // Only handle deliver type for goods requests (pickup is handled separately)
    if (parsed.type !== 'deliver') {
      return NextResponse.json({ error: 'Tipo QR non supportato per goods requests' }, { status: 400 });
    }

    const { requestId, userId } = parsed;

    // Find the goods request
    const goodsRequest = await prisma.goodsRequest.findUnique({
      where: { id: requestId },
      include: {
        beneficiary: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        fulfilledBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        intermediary: {
          select: {
            id: true,
            name: true,
            address: true,
            houseNumber: true,
            cap: true,
            city: true,
            province: true,
            phone: true,
            email: true,
            hoursInfo: true,
          },
        },
      },
    });

    if (!goodsRequest) {
      return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
    }

    if (goodsRequest.intermediaryId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Verify fulfiller ID matches (same logic as object donations)
    if (goodsRequest.fulfilledById !== userId) {
      return NextResponse.json({ error: 'QR code non valido per questo donatore' }, { status: 400 });
    }

    if (goodsRequest.status !== 'FULFILLED') {
      return NextResponse.json({ error: 'Richiesta non in stato valido per la consegna' }, { status: 400 });
    }

    // Update status to indicate delivered to entity and save location
    await prisma.goodsRequest.update({
      where: { id: requestId },
      data: {
        depositLocation: depositLocation || null,
        depositNotes: notes || null,
      },
    });

    // Generate pickup QR and send to beneficiary
    const pickupQrData = generatePickupQrCode(requestId, goodsRequest.beneficiaryId);
    const pickupQrImage = await generateAndUploadQrCode(pickupQrData, `goods-pickup-${requestId}.png`);

    await sendGoodsPickupQrNotification(
      goodsRequest.beneficiary.email,
      goodsRequest.beneficiaryId,
      goodsRequest.beneficiary.name,
      goodsRequest.title,
      requestId,
      pickupQrData,
      pickupQrImage,
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

    // Notify beneficiary in-app
    await prisma.notification.create({
      data: {
        recipientUserId: goodsRequest.beneficiaryId,
        recipientType: 'USER' as any,
        title: 'Oggetto pronto per il ritiro!',
        message: `Il bene "${goodsRequest.title}" è stato consegnato all'ente. Ritira il QR code per il ritiro.`,
        type: 'GOODS_OFFER_RECEIVED' as any,
        link: `/recipient/qr-goods/${requestId}`,
      },
    });

    return NextResponse.json({
      success: true,
      type: 'deliver',
      message: 'Consegna registrata! Il beneficiario riceverà il QR code per il ritiro.',
      data: {
        requestTitle: goodsRequest.title,
        fulfillerName: goodsRequest.fulfilledBy?.name || 'Donatore',
      },
    });
  } catch (error) {
    console.error('Goods QR scan error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
