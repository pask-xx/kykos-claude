// =============================================================
// POST /api/operator/fresh-events/templates/[id]/slots
// Pubblica un nuovo slot a partire dal template.
// Notifica tutti i beneficiari iscritti al template (FRESH_EVENT_PUBLISHED).
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

const createSlotSchema = z.object({
  scheduledStart: z.string().datetime(), // ISO 8601
  scheduledEnd: z.string().datetime(),
  capacity: z.number().int().min(1).max(500).optional(),
  pickupLocationId: z.string().optional().nullable(),
  pickupInstructions: z.string().max(2000).optional().nullable(),
});

export const POST = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: templateId } = await params;
  const session = await getOperatorSession();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const operator = await prisma.operator.findUnique({ where: { id: session.operatorId } });
  if (!operator || !operator.active) {
    return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
  }

  const body = await request.json();
  const parsed = createSlotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dati non validi', details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const template = await prisma.freshEventTemplate.findUnique({
    where: { id: templateId },
    select: {
      id: true,
      organizationId: true,
      title: true,
      capacity: true,
      defaultLocationId: true,
      defaultPickupInstructions: true,
      status: true,
    },
  });

  if (!template || template.organizationId !== session.organizationId) {
    return NextResponse.json({ error: 'Template non trovato' }, { status: 404 });
  }

  if (template.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Template non attivo' }, { status: 400 });
  }

  const scheduledStart = new Date(data.scheduledStart);
  const scheduledEnd = new Date(data.scheduledEnd);

  if (scheduledStart <= new Date()) {
    return NextResponse.json({ error: 'Lo slot deve essere nel futuro' }, { status: 400 });
  }

  if (scheduledEnd <= scheduledStart) {
    return NextResponse.json({ error: 'L\'ora di fine deve essere dopo l\'inizio' }, { status: 400 });
  }

  // Verifica location override se specificata
  const pickupLocationId = data.pickupLocationId ?? template.defaultLocationId;
  if (pickupLocationId) {
    const loc = await prisma.location.findUnique({
      where: { id: pickupLocationId },
      select: { organizationId: true },
    });
    if (!loc || loc.organizationId !== session.organizationId) {
      return NextResponse.json({ error: 'Location non valida' }, { status: 400 });
    }
  }

  // Crea slot
  const event = await prisma.freshEvent.create({
    data: {
      templateId,
      scheduledStart,
      scheduledEnd,
      capacity: data.capacity ?? template.capacity,
      pickupLocationId: pickupLocationId ?? null,
      pickupInstructions: data.pickupInstructions ?? template.defaultPickupInstructions,
      status: 'PUBLISHED',
    },
  });

  // Notifica iscritti al template (best-effort, FUORI dalla transazione)
  const subscribers = await prisma.freshEventSubscription.findMany({
    where: { templateId, active: true },
    select: { beneficiaryId: true },
  });

  if (subscribers.length > 0) {
    try {
      await prisma.notification.createMany({
        data: subscribers.map((s) => ({
          recipientUserId: s.beneficiaryId,
          recipientType: 'USER' as const,
          title: `Nuovo slot "${template.title}"`,
          message: `È disponibile un nuovo slot per "${template.title}" il ${scheduledStart.toLocaleString('it-IT')}. Prenota ora!`,
          type: 'FRESH_EVENT_PUBLISHED' as any,
          link: `/recipient/fresh-events/${event.id}`,
        })),
      });
    } catch (err) {
      console.error(`[fresh-events/slots] Failed to notify ${subscribers.length} subscribers:`, err);
    }
  }

  return NextResponse.json({ success: true, event, notifiedCount: subscribers.length }, { status: 201 });
}, 'POST /api/operator/fresh-events/templates/[id]/slots');
