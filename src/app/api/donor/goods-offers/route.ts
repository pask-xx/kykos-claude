import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
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
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ offers });
  } catch (error) {
    console.error('Error fetching goods offers:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}