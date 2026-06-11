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

  if (session.role !== 'DONOR') {
    return NextResponse.json({ error: 'Solo donatori' }, { status: 403 });
  }

  const { id: objectId } = await params;

  const object = await prisma.object.findFirst({
    where: {
      id: objectId,
      donorId: session.id,
    },
    include: {
      // Anonymity fix (Fase 34.1): rimuovere `recipient.name` incluso
      // nelle requests. Regola #1 KYKOS — il DONOR non vede MAI
      // l'identità del RICEVENTE. Vedi 01-core-principles.md
      // tabella visibilità ("DONATORE | Mai | MAI") + 04-anonymity.md
      // (regola A4). Manteniamo solo i campi minimi necessari alla UI.
      requests: {
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!object) {
    return NextResponse.json({ error: 'Oggetto non trovato' }, { status: 404 });
  }

  return NextResponse.json({ object });
}, 'GET /api/donor/objects/[id]');

export const DELETE = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  // Accettiamo DONOR (caso classico) e RECIPIENT (caso ibrido: un recipient
  // può pubblicare proprie "disponibilità" — vedi /recipient/my-objects).
  // La sicurezza è garantita dal filtro `donorId: session.id` qui sotto.
  if (session.role !== 'DONOR' && session.role !== 'RECIPIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  const { id: objectId } = await params;

  const object = await prisma.object.findFirst({
    where: {
      id: objectId,
      donorId: session.id,
      status: 'AVAILABLE',
    },
  });

  if (!object) {
    return NextResponse.json({ error: 'Oggetto non trovato o non cancellabile' }, { status: 404 });
  }

  await prisma.object.update({
    where: { id: objectId },
    data: { status: 'CANCELLED' },
  });

  return NextResponse.json({ success: true });
}, 'DELETE /api/donor/objects/[id]');