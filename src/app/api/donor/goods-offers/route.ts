import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';

export const GET = withErrorHandler(async () => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  // Authorization gap fix (Fase 34.1): un RECIPIENT autenticato poteva
  // leggere le goods-offers altrui. Ora solo DONOR accede. Vedi
  // 04-anonymity.md enforcement A4.
  if (session.role !== 'DONOR') {
    return NextResponse.json({ error: 'Solo donatori' }, { status: 403 });
  }

  // Anonymity fix (Fase 34.1): rimuovere `beneficiary.name` incluso
  // nell'include. Regola #1 KYKOS — il DONOR non vede MAI l'identità
  // del RICEVENTE. Vedi 01-core-principles.md tabella visibilità
  // ("DONATORE | Mai | MAI") + 04-anonymity.md (regola A4).
  const offers = await prisma.goodsOffer.findMany({
    where: {
      offeredById: session.id,
    },
    include: {
      request: {
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          type: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ offers });
}, 'GET /api/donor/goods-offers');