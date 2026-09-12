// =============================================================
// DELETE /api/recipient/fresh-events/reservation/[id]
// Cancellazione prenotazione (solo prima di scheduledStart).
// Concurrency-safe: transazione che libera il posto riservato o
// rimuove dalla waiting list.
// =============================================================

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api';

export const DELETE = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: reservationId } = await params;
  const session = await getSession();

  if (!session || session.role !== 'RECIPIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const reservation = await prisma.freshEventReservation.findUnique({
    where: { id: reservationId },
    select: {
      id: true,
      beneficiaryId: true,
      status: true,
      freshEvent: {
        select: {
          id: true,
          scheduledStart: true,
          status: true,
        },
      },
    },
  });

  if (!reservation || reservation.beneficiaryId !== session.id) {
    return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
  }

  if (
    reservation.status === 'CANCELLED' ||
    reservation.status === 'PICKED_UP' ||
    reservation.status === 'NO_SHOW' ||
    reservation.status === 'EXPIRED'
  ) {
    return NextResponse.json({ error: 'Prenotazione non cancellabile' }, { status: 400 });
  }

  // Non si può cancellare dopo l'inizio
  if (reservation.freshEvent.scheduledStart < new Date()) {
    return NextResponse.json(
      { error: 'Impossibile cancellare: evento già iniziato' },
      { status: 400 },
    );
  }

  // Transazione: cancella reservation + libera posto/waiting
  await prisma.$transaction(async (tx) => {
    await tx.freshEventReservation.update({
      where: { id: reservationId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    if (reservation.status === 'CONFIRMED' || reservation.status === 'ADMITTED') {
      // Libera un posto riservato
      await tx.freshEvent.update({
        where: { id: reservation.freshEvent.id },
        data: {
          reservedCount: { decrement: 1 },
          // Se era FULL, torna PUBLISHED
          status: 'PUBLISHED',
        },
      });
    } else if (reservation.status === 'WAITING') {
      // Libera un posto in waiting list + riposiziona gli altri
      await tx.freshEvent.update({
        where: { id: reservation.freshEvent.id },
        data: { waitingCount: { decrement: 1 } },
      });
      // I posizioni degli altri in WAITING non cambiano (sono univoche)
      // — se un beneficiario con posizione 5 viene ammesso dopo la cancellazione
      // del posizione 3, diventa ADMITTED (vedi flusso operator admit).
    }
  });

  return NextResponse.json({ success: true });
}, 'DELETE /api/recipient/fresh-events/reservation/[id]');
