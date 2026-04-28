import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'DONOR') {
      return NextResponse.json({ error: 'Solo i donatori possono fare offerte' }, { status: 403 });
    }

    const { requestId, message } = await request.json();

    if (!requestId) {
      return NextResponse.json({ error: 'ID richiesta mancante' }, { status: 400 });
    }

    // Check if request exists and is APPROVED
    const goodsRequest = await prisma.goodsRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        status: true,
        beneficiaryId: true,
        fulfilledById: true,
      },
    });

    if (!goodsRequest) {
      return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
    }

    if (goodsRequest.status !== 'APPROVED') {
      return NextResponse.json({ error: 'La richiesta non è più disponibile' }, { status: 400 });
    }

    if (goodsRequest.fulfilledById) {
      return NextResponse.json({ error: 'La richiesta è già stata soddisfatta' }, { status: 400 });
    }

    // Check if donor already made an offer
    const existingOffer = await prisma.goodsOffer.findFirst({
      where: {
        requestId,
        offeredById: session.id,
      },
    });

    if (existingOffer) {
      return NextResponse.json({ error: 'Hai già fatto un\'offerta per questa richiesta' }, { status: 400 });
    }

    // Create the offer
    const offer = await prisma.goodsOffer.create({
      data: {
        requestId,
        offeredById: session.id,
        message: message || null,
        status: 'PENDING',
      },
    });

    // Notify beneficiary
    await prisma.notification.create({
      data: {
        recipientId: goodsRequest.beneficiaryId,
        recipientType: 'USER' as any,
        title: 'Nuova offerta per la tua richiesta',
        message: 'Un donatore ha risposto alla tua richiesta. L\'ente valuterà l\'offerta.',
        type: 'GOODS_OFFER_RECEIVED' as any,
        link: '/recipient/requests',
      },
    });

    return NextResponse.json({
      success: true,
      offer: {
        id: offer.id,
        message: offer.message,
      },
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}