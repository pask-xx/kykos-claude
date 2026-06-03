import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';

export const GET = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  // Auth required - oggetti non visibili a pubblico
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Autenticazione richiesta' }, { status: 401 });
  }

  const { id } = await params;

  const object = await prisma.object.findUnique({
    where: { id },
    include: {
      donor: {
        select: {
          latitude: true,
          longitude: true,
          donorProfile: { select: { level: true } },
        },
      },
      intermediary: {
        select: {
          name: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  });

  if (!object) {
    return NextResponse.json({ error: 'Oggetto non trovato' }, { status: 404 });
  }

  return NextResponse.json({ object });
}, 'GET /api/objects/[id]');
