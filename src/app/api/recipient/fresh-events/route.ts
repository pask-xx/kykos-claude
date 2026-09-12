// =============================================================
// GET /api/recipient/fresh-events
// Lista slot futuri pubblicati del proprio ente.
// Anonimato: ritorna solo dati evento, mai donor name.
// =============================================================

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api';
import { getFreshSuspensionStatus } from '@/lib/fresh-events';

export const GET = withErrorHandler(async () => {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  if (session.role !== 'RECIPIENT') {
    return NextResponse.json({ error: 'Accesso non consentito' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      referenceEntityId: true,
      authorized: true,
      freshSuspendedUntil: true,
      freshWarnings: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
  }

  // Se non ha ente di riferimento, non vede nulla
  if (!user.referenceEntityId) {
    return NextResponse.json({
      suspended: false,
      events: [],
      message: 'Devi essere associato a un ente per vedere i prodotti freschi',
    });
  }

  // Verifica sospensione
  const suspension = getFreshSuspensionStatus(user);

  // Slot futuri pubblicati del proprio ente (PUBLISHED o FULL = ancora accetta waiting list)
  const now = new Date();
  const events = await prisma.freshEvent.findMany({
    where: {
      template: { organizationId: user.referenceEntityId },
      status: { in: ['PUBLISHED', 'FULL'] },
      scheduledStart: { gt: now },
    },
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
          startTime: true,
          endTime: true,
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
    orderBy: { scheduledStart: 'asc' },
  });

  // Per ogni evento verifica se il beneficiario ha già prenotato
  const eventsWithReservation = await Promise.all(
    events.map(async (event) => {
      const reservation = await prisma.freshEventReservation.findUnique({
        where: {
          freshEventId_beneficiaryId: {
            freshEventId: event.id,
            beneficiaryId: session.id,
          },
        },
        select: {
          id: true,
          status: true,
          position: true,
          qrCode: true,
        },
      });

      return {
        ...event,
        myReservation: reservation ?? null,
      };
    }),
  );

  return NextResponse.json({
    suspended: suspension.suspended,
    suspendedUntil: suspension.until,
    warnings: suspension.warnings,
    events: eventsWithReservation,
  });
}, 'GET /api/recipient/fresh-events');
