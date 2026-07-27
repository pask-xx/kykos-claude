import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api';

/**
 * GET /api/intermediary/operators/[id]/locations
 *
 * Ritorna TUTTE le sedi dell'ente + flag `enabled` per indicare quali sono
 * abilitate per l'operatore specificato. La UI usa questo per mostrare
 * la checkbox group "abilita a queste sedi" senza dover fare 2 fetch.
 *
 * Solo INTERMEDIARY. Check cross-org: l'operatore deve appartenere all'ente
 * corrente (altrimenti 404, non 403, per non leakare l'esistenza).
 *
 * NOTA privacy/anonimato: NON ritorniamo `operator.firstName/lastName` qui —
 * questa route è per il form di gestione sedi, l'anagrafica operatore è
 * già disponibile nella pagina dettaglio operatore.
 */
export const GET = withErrorHandler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  if (session.role !== 'INTERMEDIARY') {
    return NextResponse.json(
      { error: 'Solo gli enti possono gestire le abilitazioni' },
      { status: 403 }
    );
  }

  const { id: operatorId } = await ctx.params;
  if (!operatorId) {
    return NextResponse.json({ error: 'ID operatore mancante' }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({
    where: { userId: session.id },
    select: { id: true },
  });
  if (!org) {
    return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
  }

  // Verifica che l'operatore appartenga all'ente
  const operator = await prisma.operator.findFirst({
    where: { id: operatorId, organizationId: org.id },
    select: { id: true },
  });
  if (!operator) {
    return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
  }

  // Tutte le sedi dell'ente (anche non attive, per admin/audit)
  // + le abilitazioni dell'operatore (solo sedi attive nel filtro abilitazione)
  const [locations, enabledRelations] = await Promise.all([
    prisma.location.findMany({
      where: { organizationId: org.id },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        address: true,
        city: true,
        isActive: true,
      },
    }),
    prisma.operatorLocation.findMany({
      where: { operatorId, location: { organizationId: org.id } },
      select: { locationId: true },
    }),
  ]);

  const enabledIds = new Set(enabledRelations.map((r) => r.locationId));

  return NextResponse.json({
    locations: locations.map((l) => ({
      ...l,
      enabled: enabledIds.has(l.id),
    })),
  });
}, 'GET /api/intermediary/operators/[id]/locations');

const locationsIdArraySchema = z.array(z.string().min(1)).max(100);

/**
 * PUT /api/intermediary/operators/[id]/locations
 *
 * Sostituisce l'INTERO set di sedi abilitate per l'operatore specificato.
 * Idempotente e atomica: dentro `prisma.$transaction`:
 *   1) `deleteMany` di TUTTE le OperatorLocation dell'operatore (per sedi
 *      dell'ente corrente)
 *   2) `createMany` delle nuove abilitazioni
 *
 * PERCHÉ "deleteMany + createMany" e non "skip if exists":
 * - Più semplice: la UI invia lo stato finale voluto, non il delta
 * - Idempotente per definizione (stesso payload = stesso risultato)
 * - Performance: operatori hanno tipicamente 1-5 sedi abilitate, non migliaia
 *
 * Sicurezza: validiamo che TUTTI i locationId appartengano all'ente corrente
 * (no spoofing di sedi altrui). Se qualche ID è fuori ente → 400.
 *
 * Check cross-org operatore: 404 se l'operatore non è dell'ente.
 */
export const PUT = withErrorHandler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  if (session.role !== 'INTERMEDIARY') {
    return NextResponse.json(
      { error: 'Solo gli enti possono gestire le abilitazioni' },
      { status: 403 }
    );
  }

  const { id: operatorId } = await ctx.params;
  if (!operatorId) {
    return NextResponse.json({ error: 'ID operatore mancante' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const parsed = locationsIdArraySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `locationIds non valido: ${parsed.error.issues[0]?.message ?? 'errore'}` },
      { status: 400 }
    );
  }
  const locationIds = parsed.data;

  const org = await prisma.organization.findUnique({
    where: { userId: session.id },
    select: { id: true },
  });
  if (!org) {
    return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
  }

  const operator = await prisma.operator.findFirst({
    where: { id: operatorId, organizationId: org.id },
    select: { id: true },
  });
  if (!operator) {
    return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
  }

  // Sicurezza anti-spoofing: tutti i locationId devono appartenere all'ente
  if (locationIds.length > 0) {
    const ownedCount = await prisma.location.count({
      where: { id: { in: locationIds }, organizationId: org.id },
    });
    if (ownedCount !== locationIds.length) {
      return NextResponse.json(
        { error: 'Una o più sedi non appartengono al tuo ente' },
        { status: 400 }
      );
    }
  }

  // Idempotente: in tx, prima cancello TUTTO il set corrente (per questo ente),
  // poi inserisco il nuovo set. Così due PUT identici producono lo stesso stato.
  await prisma.$transaction(async (tx) => {
    await tx.operatorLocation.deleteMany({
      where: {
        operatorId,
        location: { organizationId: org.id },
      },
    });
    if (locationIds.length > 0) {
      await tx.operatorLocation.createMany({
        data: locationIds.map((locationId) => ({
          id: randomUUID(),
          operatorId,
          locationId,
        })),
        // skipDuplicates true è doppia difesa: la unique constraint su
        // (operatorId, locationId) impedisce comunque duplicati.
        skipDuplicates: true,
      });
    }
  });

  return NextResponse.json({ ok: true, count: locationIds.length });
}, 'PUT /api/intermediary/operators/[id]/locations');
