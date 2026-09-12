// =============================================================
// GET/POST /api/operator/fresh-events/templates
// Lista template dell'ente (GET) + crea nuovo template (POST).
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

const createTemplateSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional().nullable(),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  capacity: z.number().int().min(1).max(500),
  defaultLocationId: z.string().optional().nullable(),
  defaultPickupInstructions: z.string().max(2000).optional().nullable(),
});

export const GET = withErrorHandler(async () => {
  const session = await getOperatorSession();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const operator = await prisma.operator.findUnique({ where: { id: session.operatorId } });
  if (!operator || !operator.active) {
    return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
  }

  const templates = await prisma.freshEventTemplate.findMany({
    where: { organizationId: session.organizationId },
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
      createdAt: true,
      defaultLocation: {
        select: { id: true, address: true, city: true },
      },
      _count: {
        select: {
          subscriptions: { where: { active: true } },
          slots: {
            where: {
              status: { in: ['PUBLISHED', 'FULL'] },
              scheduledStart: { gt: new Date() },
            },
          },
        },
      },
    },
    orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
  });

  return NextResponse.json({ templates });
}, 'GET /api/operator/fresh-events/templates');

export const POST = withErrorHandler(async (request: Request) => {
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
  const parsed = createTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dati non validi', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Verifica location (se specificata) appartenga all'ente
  if (data.defaultLocationId) {
    const loc = await prisma.location.findUnique({
      where: { id: data.defaultLocationId },
      select: { organizationId: true },
    });
    if (!loc || loc.organizationId !== session.organizationId) {
      return NextResponse.json({ error: 'Location non valida' }, { status: 400 });
    }
  }

  const template = await prisma.freshEventTemplate.create({
    data: {
      organizationId: session.organizationId,
      title: data.title,
      description: data.description ?? null,
      weekday: data.weekday,
      startTime: data.startTime,
      endTime: data.endTime,
      capacity: data.capacity,
      defaultLocationId: data.defaultLocationId ?? null,
      defaultPickupInstructions: data.defaultPickupInstructions ?? null,
      status: 'ACTIVE',
    },
  });

  return NextResponse.json({ success: true, template }, { status: 201 });
}, 'POST /api/operator/fresh-events/templates');
