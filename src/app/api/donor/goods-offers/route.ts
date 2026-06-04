import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';

export const GET = withErrorHandler(async () => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  // Get all goods offers made by this user with their request info
  const offers = await prisma.goodsOffer.findMany({
    where: {
      offeredById: session.id,
    },
    include: {
      request: {
        include: {
          beneficiary: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ offers });
}, 'GET /api/donor/goods-offers');