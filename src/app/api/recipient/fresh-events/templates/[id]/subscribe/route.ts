// =============================================================
// POST/DELETE /api/recipient/fresh-events/templates/[id]/subscribe
// Iscrizione / disiscrizione da un template.
// POST: crea (o riattiva) subscription
// DELETE: soft delete (active = false)
// =============================================================

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api';

export const POST = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: templateId } = await params;
  const session = await getSession();

  if (!session || session.role !== 'RECIPIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  // Verifica che il template appartenga al proprio ente
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { referenceEntityId: true },
  });

  if (!user?.referenceEntityId) {
    return NextResponse.json({ error: 'Devi essere associato a un ente' }, { status: 403 });
  }

  const template = await prisma.freshEventTemplate.findUnique({
    where: { id: templateId },
    select: { organizationId: true, status: true },
  });

  if (!template || template.organizationId !== user.referenceEntityId) {
    return NextResponse.json({ error: 'Template non trovato' }, { status: 404 });
  }

  if (template.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Template non più attivo' }, { status: 400 });
  }

  // Upsert: se esiste subscription con active=false, riattiva. Altrimenti crea.
  const subscription = await prisma.freshEventSubscription.upsert({
    where: {
      templateId_beneficiaryId: {
        templateId,
        beneficiaryId: session.id,
      },
    },
    update: { active: true },
    create: {
      templateId,
      beneficiaryId: session.id,
      active: true,
    },
  });

  return NextResponse.json({ success: true, subscription });
}, 'POST /api/recipient/fresh-events/templates/[id]/subscribe');

export const DELETE = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: templateId } = await params;
  const session = await getSession();

  if (!session || session.role !== 'RECIPIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  // Soft delete: imposta active=false invece di cancellare (preserva storico notifiche)
  await prisma.freshEventSubscription.updateMany({
    where: {
      templateId,
      beneficiaryId: session.id,
    },
    data: { active: false },
  });

  return NextResponse.json({ success: true });
}, 'DELETE /api/recipient/fresh-events/templates/[id]/subscribe');
