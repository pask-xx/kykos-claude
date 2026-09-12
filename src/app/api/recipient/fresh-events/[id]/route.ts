// =============================================================
// GET /api/recipient/fresh-events/[id]
// Dettaglio slot: capacità, posti liberi, istruzioni, eventuale QR.
// Anonimato: ritorna solo dati evento, mai donor name.
// =============================================================

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api';
import { canReserveFreshSlot } from '@/lib/fresh-events';

export const GET = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  const session = await getSession();

  if (!session || session.role !== 'RECIPIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { referenceEntityId: true },
  });

  if (!user?.referenceEntityId) {
    return NextResponse.json({ error: 'Devi essere associato a un ente' }, { status: 403 });
  }

  const event = await prisma.freshEvent.findUnique({
    where: { id },
    select: {
      id: true,
      scheduledStart: true,
      scheduledEnd: true,
      capacity: true,
      reservedCount: true,
      waitingCount: true,
      pickupInstructions: true,
      status: true,
      template: {
        select: {
          id: true,
          title: true,
          description: true,
          organizationId: true,
        },
      },
      pickupLocation: {
        select: {
          id: true,
          address: true,
          city: true,
          postalCode: true,
        },
      },
    },
  });

  if (!event || event.template.organizationId !== user.referenceEntityId) {
    return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 });
  }

  // Mia prenotazione (se esiste)
  const myReservation = await prisma.freshEventReservation.findUnique({
    where: {
      freshEventId_beneficiaryId: {
        freshEventId: id,
        beneficiaryId: session.id,
      },
    },
    select: {
      id: true,
      status: true,
      position: true,
      qrCode: true,
      reservedAt: true,
    },
  });

  // Verifica se posso prenotare
  const canReserve = await canReserveFreshSlot(session.id, id);

  return NextResponse.json({
    event,
    myReservation,
    canReserve,
  });
}, 'GET /api/recipient/fresh-events/[id]');
