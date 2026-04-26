import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'RECIPIENT') {
      return NextResponse.json({ error: 'Solo riceventi' }, { status: 403 });
    }

    const requests = await prisma.request.findMany({
      where: { recipientId: session.id },
      include: {
        object: {
          select: {
            id: true,
            title: true,
            category: true,
            condition: true,
            imageUrls: true,
            status: true,
            depositLocation: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
