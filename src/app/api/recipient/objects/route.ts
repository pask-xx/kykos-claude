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
      return NextResponse.json({ error: 'Solo i riceventi possono fare richieste' }, { status: 403 });
    }

    // Get objects available through the recipient's intermediary
    const recipient = await prisma.user.findUnique({
      where: { id: session.id },
      select: { requests: { select: { objectId: true } } },
    });

    const requestedObjectIds = recipient?.requests.map(r => r.objectId) || [];

    const objects = await prisma.object.findMany({
      where: {
        status: 'AVAILABLE',
        NOT: { id: { in: requestedObjectIds } },
      },
      include: {
        donor: { select: { name: true } },
        intermediary: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ objects });
  } catch (error) {
    console.error('Error fetching objects:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
