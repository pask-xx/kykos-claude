import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';

export const GET = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo admin' }, { status: 403 });
  }

  const { id } = await params;

  const intermediary = await prisma.organization.findUnique({
    where: { id },
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
      authorizedRecipients: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!intermediary) {
    return NextResponse.json({ error: 'Ente non trovato' }, { status: 404 });
  }

  return NextResponse.json({ intermediary });
}, 'GET /api/admin/intermediaries/[id]');
