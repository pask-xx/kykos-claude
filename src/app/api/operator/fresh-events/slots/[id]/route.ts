// =============================================================
// GET/PATCH /api/operator/fresh-events/slots/[id]
// GET: dettaglio slot + lista prenotati (CONFIRMED/ADMITTED) + waiting list
// PATCH: modifica istruzioni ritiro, location override, status (CLOSE/COMPLETE/CANCEL)
// =============================================================

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getJwtSecret } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';

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

const updateSlotSchema = z.object({
  pickupInstructions: z.string().max(2000).optional().nullable(),
  pickupLocationId: z.string().optional().nullable(),
  status: z.enum(['CLOSED', 'COMPLETED', 'CANCELLED']).optional(),
});

export const GET = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  const session = await getOperatorSession();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const operator = await prisma.operator.findUnique({ where: { id: session.operatorId } });
  if (!operator || !operator.active) {
    return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
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
      publishedAt: true,
      closedAt: true,
      template: {
        select: {
          id: true,
          title: true,
          description: true,
          organizationId: true,
        },
      },
      pickupLocation: {
        select: { id: true, address: true, city: true, postalCode: true },
      },
      reservations: {
        select: {
          id: true,
          status: true,
          position: true,
          reservedAt: true,
          admittedAt: true,
          pickedUpAt: true,
          cancelledAt: true,
          noShowAt: true,
          beneficiary: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nickname: true,
              name: true,
              freshWarnings: true,
              freshSuspendedUntil: true,
            },
          },
        },
        orderBy: [{ status: 'asc' }, { position: 'asc' }, { reservedAt: 'asc' }],
      },
    },
  });

  if (!event || event.template.organizationId !== session.organizationId) {
    return NextResponse.json({ error: 'Slot non trovato' }, { status: 404 });
  }

  const { template, ...rest } = event;
  const { organizationId: _ignored, ...templateRest } = template;
  return NextResponse.json({ event: { ...rest, template: templateRest } });
}, 'GET /api/operator/fresh-events/slots/[id]');

export const PATCH = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  const session = await getOperatorSession();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const operator = await prisma.operator.findUnique({ where: { id: session.operatorId } });
  if (!operator || !operator.active) {
    return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateSlotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dati non validi', details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.freshEvent.findUnique({
    where: { id },
    select: { template: { select: { organizationId: true } } },
  });

  if (!existing || existing.template.organizationId !== session.organizationId) {
    return NextResponse.json({ error: 'Slot non trovato' }, { status: 404 });
  }

  // Verifica location se cambiata
  if (parsed.data.pickupLocationId) {
    const loc = await prisma.location.findUnique({
      where: { id: parsed.data.pickupLocationId },
      select: { organizationId: true },
    });
    if (!loc || loc.organizationId !== session.organizationId) {
      return NextResponse.json({ error: 'Location non valida' }, { status: 400 });
    }
  }

  const updated = await prisma.freshEvent.update({
    where: { id },
    data: {
      ...parsed.data,
      closedAt: parsed.data.status ? new Date() : undefined,
    },
  });

  return NextResponse.json({ success: true, event: updated });
}, 'PATCH /api/operator/fresh-events/slots/[id]');
