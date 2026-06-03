import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hasAnyPermission } from '@/lib/permissions';
import { withErrorHandler } from '@/lib/api';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

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

export const GET = withErrorHandler(async () => {

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

}, 'GET /api/operator/goods-offers');

export const PATCH = withErrorHandler(async (request: Request) => {

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
  } else if (action === 'reject') {
    await prisma.goodsOffer.update({
      where: { id: offerId },
      data: { status: 'REJECTED' },
    });
  } else {
    return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
  }

  return NextResponse.json({ success: true });

}, 'PATCH /api/operator/goods-offers');