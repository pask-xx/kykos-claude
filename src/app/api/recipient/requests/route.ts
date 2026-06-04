import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';

export const GET = withErrorHandler(async () => {
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
}, 'GET /api/recipient/requests');
