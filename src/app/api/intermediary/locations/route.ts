import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api';
import { parseLocationInput } from '@/lib/location-validation';

/**
 * GET /api/intermediary/locations
 *
 * Lista le sedi aggiuntive (COLLECTION_POINT) dell'ente corrente.
 * Solo INTERMEDIARY autenticato. Filtra per organizationId dalla session
 * (no spoofing). Include conteggio operatori abilitati per UI.
 *
 * NOTA privacy/anonimato: i nomi operatori NON sono esposti (solo count).
 * La route ritorna solo `operatorCount` per mostrare "N operatori abilitati"
 * senza rivelare anagrafica operatori a chi gestisce le sedi.
 */
export const GET = withErrorHandler(async () => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  if (session.role !== 'INTERMEDIARY') {
    return NextResponse.json(
      { error: 'Solo gli enti possono gestire le sedi' },
      { status: 403 }
    );
  }

  const org = await prisma.organization.findUnique({
    where: { userId: session.id },
    select: { id: true },
  });
  if (!org) {
    return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
  }

  const locations = await prisma.location.findMany({
    where: { organizationId: org.id },
    orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
    include: {
      _count: {
        select: { operatorLocations: true },
      },
    },
  });

  return NextResponse.json({ locations });
}, 'GET /api/intermediary/locations');

/**
 * POST /api/intermediary/locations
 *
 * Crea una nuova sede aggiuntiva (COLLECTION_POINT) per l'ente corrente.
 * - Solo INTERMEDIARY
 * - `organizationId` dedotto dalla session (mai dal body — no spoofing)
 * - `kind` sempre COLLECTION_POINT (la sede principale resta su Organization)
 * - Validazione con zod (`locationInputSchema`)
 * - `id` generato server-side (cuid-like via randomUUID per uniformità col resto)
 */
export const POST = withErrorHandler(async (req: Request) => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  if (session.role !== 'INTERMEDIARY') {
    return NextResponse.json(
      { error: 'Solo gli enti possono creare sedi' },
      { status: 403 }
    );
  }

  const org = await prisma.organization.findUnique({
    where: { userId: session.id },
    select: { id: true },
  });
  if (!org) {
    return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const parsed = parseLocationInput(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const now = new Date();
  const location = await prisma.location.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      kind: 'COLLECTION_POINT',
      address: parsed.data.address,
      city: parsed.data.city,
      postalCode: parsed.data.postalCode,
      province: parsed.data.province ?? null,
      country: parsed.data.country,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      // Se hours non è stato passato, Prisma salta il campo in update.
      // In create passiamo sempre un valore (anche {}).
      hours: parsed.data.hours ?? {},
      notes: parsed.data.notes ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  return NextResponse.json({ location }, { status: 201 });
}, 'POST /api/intermediary/locations');
