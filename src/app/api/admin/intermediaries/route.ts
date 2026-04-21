import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 });
    }

    const intermediaries = await prisma.organization.findMany({
      include: {
        user: {
          select: { email: true, createdAt: true },
        },
        _count: {
          select: {
            objects: true,
            requests: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ intermediaries });
  } catch (error) {
    console.error('Error fetching intermediaries:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
