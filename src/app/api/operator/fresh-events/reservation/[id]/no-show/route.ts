// =============================================================
// POST /api/operator/fresh-events/reservation/[id]/no-show
// Conferma no-show di un beneficiario:
//   - Marca reservation come NO_SHOW
//   - Libera il posto riservato
//   - Incrementa User.freshWarnings
//   - Se raggiunge soglia ente, applica sospensione automatica
//   - Invia notifica + email al beneficiario
// =============================================================

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { getJwtSecret } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';
import { incrementFreshWarnings } from '@/lib/fresh-events';

const JWT_SECRET = getJwtSecret();

interface OperatorSession {
  operatorId: string;
  organizationId: string;
  username: string;
  role: string;
}

async function getOperatorSession(): Promise<OperatorSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('operator_session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as OperatorSession;
  } catch {
    return null;
  }
}

export const POST = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: reservationId } = await params;
  const session = await getOperatorSession();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const operator = await prisma.operator.findUnique({ where: { id: session.operatorId } });
  if (!operator || !operator.active) {
    return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
  }

  // Verifica reservation
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
          scheduledEnd: true,
          template: {
            select: { organizationId: true, title: true },
          },
        },
      },
    },
  });

  if (!reservation || reservation.freshEvent.template.organizationId !== session.organizationId) {
    return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
  }

  if (
    reservation.status === 'PICKED_UP' ||
    reservation.status === 'CANCELLED' ||
    reservation.status === 'NO_SHOW' ||
    reservation.status === 'EXPIRED'
  ) {
    return NextResponse.json({ error: 'Prenotazione non in stato valido per no-show' }, { status: 400 });
  }

  // Marca no-show + libera posto
  await prisma.$transaction(async (tx) => {
    await tx.freshEventReservation.update({
      where: { id: reservationId },
      data: {
        status: 'NO_SHOW',
        noShowAt: new Date(),
      },
    });

    // Libera posto riservato (lo slot torna PUBLISHED)
    if (reservation.status === 'CONFIRMED' || reservation.status === 'ADMITTED') {
      await tx.freshEvent.update({
        where: { id: reservation.freshEvent.id },
        data: {
          reservedCount: { decrement: 1 },
          status: 'PUBLISHED',
        },
      });
    } else if (reservation.status === 'WAITING') {
      await tx.freshEvent.update({
        where: { id: reservation.freshEvent.id },
        data: { waitingCount: { decrement: 1 } },
      });
    }
  });

  // Incrementa warning + eventuale sospensione automatica
  const warningResult = await incrementFreshWarnings(
    reservation.beneficiaryId,
    session.organizationId,
  );

  // Notifica in-app al beneficiario
  try {
    await prisma.notification.create({
      data: {
        recipientUserId: reservation.beneficiaryId,
        recipientType: 'USER',
        title: warningResult.justSuspended
          ? `Sospensione dai prodotti freschi`
          : `Warning no-show: ${warningResult.warnings}`,
        message: warningResult.justSuspended
          ? `Hai raggiunto ${warningResult.warnings} warning. Sei sospeso dai prodotti freschi fino al ${warningResult.suspendedUntil?.toLocaleDateString('it-IT')}.`
          : `Hai totalizzato ${warningResult.warnings} warning per no-show. Continua ad accumulare warning e verrai sospeso automaticamente.`,
        type: warningResult.justSuspended ? 'FRESH_SUSPENDED' : 'FRESH_NO_SHOW_WARNING',
      },
    });
  } catch (err) {
    console.error(`[fresh-events/no-show] Failed to create notification:`, err);
  }

  return NextResponse.json({
    success: true,
    warnings: warningResult.warnings,
    suspendedUntil: warningResult.suspendedUntil,
    justSuspended: warningResult.justSuspended,
  });
}, 'POST /api/operator/fresh-events/reservation/[id]/no-show');
