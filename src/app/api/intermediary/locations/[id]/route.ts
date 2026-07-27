import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api';
import { parseLocationInput } from '@/lib/location-validation';

/**
 * PUT /api/intermediary/locations/[id]
 *
 * Aggiorna una sede esistente. Check cross-org: l'ente può modificare
 * SOLO le proprie sedi. Se la sede appartiene a un altro ente → 404
 * (non 403, per non leakare l'esistenza della sede altrui).
 *
 * Validazione con zod. Non permesso cambiare `organizationId` o `kind`
 * (la v1 prevede solo COLLECTION_POINT e la sede resta ancorata all'ente).
 */
export const PUT = withErrorHandler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  if (session.role !== 'INTERMEDIARY') {
    return NextResponse.json(
      { error: 'Solo gli enti possono modificare le sedi' },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: 'ID sede mancante' }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({
    where: { userId: session.id },
    select: { id: true },
  });
  if (!org) {
    return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
  }

  // Check ownership PRIMA della validazione: 404 se la sede non è dell'ente
  const existing = await prisma.location.findFirst({
    where: { id, organizationId: org.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Sede non trovata' }, { status: 404 });
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

  const location = await prisma.location.update({
    where: { id },
    data: {
      address: parsed.data.address,
      city: parsed.data.city,
      postalCode: parsed.data.postalCode,
      province: parsed.data.province ?? null,
      country: parsed.data.country,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      // Per cancellare esplicitamente il campo hours serve Prisma.JsonNull
      // (non lo esponiamo per ora). Se hours non è passato, omettiamo il campo
      // dall'update usando un cast difensivo: TypeScript non sa che le chiavi
      // dello spread condizionale sono opzionali a livello Prisma UpdateInput.
      updatedAt: new Date(),
      ...(parsed.data.hours !== undefined
        ? { hours: parsed.data.hours as unknown as object }
        : {}),
      ...(parsed.data.notes !== undefined
        ? { notes: parsed.data.notes ?? null }
        : {}),
    } as any,
  });

  return NextResponse.json({ location });
}, 'PUT /api/intermediary/locations/[id]');

/**
 * DELETE /api/intermediary/locations/[id]
 *
 * Soft-delete di una sede: `isActive = false`. NON cancello fisicamente
 * perché le sedi sono referenziate da OperatorLocation e (in futuro) da
 * Donation: la cancellazione romperebbe lo storico. Lo stato `isActive=false`
 * nasconde la sede dalle UI future di selezione donazioni, ma la riga
 * resta per audit/integrità referenziale.
 *
 * Eventuali OperatorLocation restano attive (l'operatore resta abilitato
 * alla sede "archiviata"). In futuro: quando aggiungeremo i campi
 * pickedUpAtLocationId/deliveredAtLocationId sulle Donation, una sede
 * con storico non sarà cancellabile in nessun modo.
 *
 * Check cross-org: 404 se la sede non è dell'ente (no leak esistenza).
 * Idempotente: se già disattivata, risponde 200 senza scrivere.
 */
export const DELETE = withErrorHandler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  if (session.role !== 'INTERMEDIARY') {
    return NextResponse.json(
      { error: 'Solo gli enti possono disattivare le sedi' },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: 'ID sede mancante' }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({
    where: { userId: session.id },
    select: { id: true },
  });
  if (!org) {
    return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
  }

  const existing = await prisma.location.findFirst({
    where: { id, organizationId: org.id },
    select: { id: true, isActive: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Sede non trovata' }, { status: 404 });
  }

  if (existing.isActive) {
    await prisma.location.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}, 'DELETE /api/intermediary/locations/[id]');
