import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';

export const GET = withErrorHandler(async (request: Request) => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  if (session.role !== 'DONOR' && session.role !== 'RECIPIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter');

  if (filter === 'requests') {
    // Return objects that have been requested (RESERVED, DEPOSITED, DONATED)
    const objects = await prisma.object.findMany({
      where: {
        donorId: session.id,
        status: { in: ['RESERVED', 'DEPOSITED', 'DONATED'] },
      },
      include: {
        // Anonymity: NIENTE `recipient: { select: { name: true } }` —
        // Regola #1 KYKOS. Solo id/status/createdAt per le requests
        // innestate. Vedi Fase 34.1.
        requests: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
        // Conteggio totale richieste (serve per showRequestCount
        // sulla ExpandableObjectCard su /donor/objects e /donor/requests).
        _count: {
          select: { requests: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ objects });
  }

  const objects = await prisma.object.findMany({
    where: { donorId: session.id },
    include: {
      // Conteggio richieste anche qui (stessa ragione del filter=requests).
      _count: { select: { requests: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ objects });
}, 'GET /api/donor/objects');
