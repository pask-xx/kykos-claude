// =============================================================
// GET/PATCH/DELETE /api/operator/fresh-events/templates/[id]
// GET: dettaglio template + storico slot
// PATCH: modifica template (descrizione, orari, capacità, location, istruzioni)
// DELETE: soft delete (status = ARCHIVED)
// =============================================================

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getJwtSecret } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';
import { hasAnyPermission } from '@/lib/permissions';

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

const updateTemplateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  weekday: z.number().int().min(0).max(6).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  capacity: z.number().int().min(1).max(500).optional(),
  defaultLocationId: z.string().optional().nullable(),
  defaultPickupInstructions: z.string().max(2000).optional().nullable(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
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

  const template = await prisma.freshEventTemplate.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      weekday: true,
      startTime: true,
      endTime: true,
      capacity: true,
      defaultPickupInstructions: true,
      isActive: true,
      status: true,
      organizationId: true,
      defaultLocation: { select: { id: true, address: true, city: true } },
      _count: { select: { subscriptions: { where: { active: true } } } },
      slots: {
        select: {
          id: true,
          scheduledStart: true,
          scheduledEnd: true,
          capacity: true,
          reservedCount: true,
          waitingCount: true,
          status: true,
        },
        orderBy: { scheduledStart: 'desc' },
        take: 30,
      },
    },
  });

  if (!template || template.organizationId !== session.organizationId) {
    return NextResponse.json({ error: 'Template non trovato' }, { status: 404 });
  }

  // Rimuovi organizationId dalla response (era solo per il check)
  const { organizationId, ...rest } = template;
  return NextResponse.json({ template: rest });
}, 'GET /api/operator/fresh-events/templates/[id]');

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

  if (!hasAnyPermission(operator.role, operator.permissions, ['ORGANIZATION_ADMIN', 'REQUEST_PROXY'])) {
    return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dati non validi', details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.freshEventTemplate.findUnique({
    where: { id },
    select: { organizationId: true },
  });

  if (!existing || existing.organizationId !== session.organizationId) {
    return NextResponse.json({ error: 'Template non trovato' }, { status: 404 });
  }

  // Verifica location se cambiata
  if (parsed.data.defaultLocationId) {
    const loc = await prisma.location.findUnique({
      where: { id: parsed.data.defaultLocationId },
      select: { organizationId: true },
    });
    if (!loc || loc.organizationId !== session.organizationId) {
      return NextResponse.json({ error: 'Location non valida' }, { status: 400 });
    }
  }

  const updated = await prisma.freshEventTemplate.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ success: true, template: updated });
}, 'PATCH /api/operator/fresh-events/templates/[id]');

export const DELETE = withErrorHandler(async (
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

  if (!hasAnyPermission(operator.role, operator.permissions, ['ORGANIZATION_ADMIN'])) {
    return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
  }

  const existing = await prisma.freshEventTemplate.findUnique({
    where: { id },
    select: { organizationId: true, slots: { where: { status: { in: ['PUBLISHED', 'FULL'] } }, select: { id: true } } },
  });

  if (!existing || existing.organizationId !== session.organizationId) {
    return NextResponse.json({ error: 'Template non trovato' }, { status: 404 });
  }

  if (existing.slots.length > 0) {
    return NextResponse.json(
      { error: 'Impossibile archiviare: ci sono slot futuri pubblicati. Chiudili prima.' },
      { status: 400 },
    );
  }

  await prisma.freshEventTemplate.update({
    where: { id },
    data: { status: 'ARCHIVED', isActive: false },
  });

  return NextResponse.json({ success: true });
}, 'DELETE /api/operator/fresh-events/templates/[id]');
