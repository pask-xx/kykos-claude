// =============================================================
// GET /api/recipient/fresh-events/my-reservations
// Lista le mie prenotazioni (attive + storiche).
// Anonimato: ritorna solo i dati del beneficiario stesso (già noti).
// =============================================================

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api';

export const GET = withErrorHandler(async () => {
  const session = await getSession();

  if (!session || session.role !== 'RECIPIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const reservations = await prisma.freshEventReservation.findMany({
    where: { beneficiaryId: session.id },
    select: {
      id: true,
      status: true,
      position: true,
      reservedAt: true,
      admittedAt: true,
      pickedUpAt: true,
      cancelledAt: true,
      freshEvent: {
        select: {
          id: true,
          scheduledStart: true,
          scheduledEnd: true,
          pickupInstructions: true,
          status: true,
          template: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          pickupLocation: {
            select: {
              id: true,
              address: true,
              city: true,
            },
          },
        },
      },
    },
    orderBy: { reservedAt: 'desc' },
  });

  return NextResponse.json({ reservations });
}, 'GET /api/recipient/fresh-events/my-reservations');
