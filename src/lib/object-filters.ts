import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Scope di visibilità oggetti per un recipient autenticato.
 *
 * Discriminated union usata dai caller per decidere se ritornare array
 * vuoto, errore 403, o procedere con il filtro Prisma.
 *
 * - `ok`           → il recipient è associato a un ente ed è autorizzato
 * - `no-entity`    → il recipient non ha un `referenceEntityId` (non ancora
 *                    associato a un ente)
 * - `unauthorized` → il recipient è associato a un ente ma l'ente non lo
 *                    ha ancora abilitato (`User.authorized === false`)
 */
export type RecipientScope =
  | { kind: 'ok'; referenceEntityId: string }
  | { kind: 'no-entity' }
  | { kind: 'unauthorized' };

/**
 * Risolve lo scope di visibilità oggetti per un recipient autenticato.
 *
 * Replica la logica di `/api/recipient/objects` (dashboard):
 * - utente non trovato             → `no-entity`
 * - `referenceEntityId` nullo     → `no-entity`
 * - `authorized === false`        → `unauthorized`
 * - altrimenti                     → `ok` con `referenceEntityId`
 *
 * L'helper è puro (non importa `next/headers` né `getSession`): riceve
 * un `recipientId` già risolto dalla sessione del caller. Vantaggio:
 * testabile in isolamento con un semplice mock di `prisma.user.findUnique`.
 *
 * @param recipientId  id del recipient (User.id, NON authUserId Supabase)
 * @returns discriminated union RecipientScope
 *
 * @example
 *   const scope = await getRecipientScope(session.id);
 *   if (scope.kind !== 'ok') {
 *     return NextResponse.json({ objects: [] });
 *   }
 *   // scope.referenceEntityId usabile per il filtro Prisma
 */
export async function getRecipientScope(recipientId: string): Promise<RecipientScope> {
  const user = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { referenceEntityId: true, authorized: true },
  });

  if (!user?.referenceEntityId) {
    return { kind: 'no-entity' };
  }

  if (!user.authorized) {
    return { kind: 'unauthorized' };
  }

  return { kind: 'ok', referenceEntityId: user.referenceEntityId };
}

/**
 * Costruisce il `Prisma.ObjectWhereInput` per gli oggetti visibili a un recipient.
 *
 * Filtri applicati (tutti in AND):
 * - `status: 'AVAILABLE'`
 * - `intermediaryId === recipient.referenceEntityId` (scope multi-tenancy)
 * - esclude oggetti già richiesti dal recipient (via `Request.objectId IN ...`)
 * - esclude oggetti propri (`donorId === recipientId`)
 *
 * Lo scope `no-entity` / `unauthorized` produce `where === null` per
 * permettere al caller di ritornare `200 { objects: [] }` senza esporre
 * dettagli del perché il recipient non vede oggetti.
 *
 * Quando lo scope non è `ok`, la sub-query `prisma.request.findMany` NON
 * viene eseguita (short-circuit prima della query).
 *
 * La categoria opzionale (`extra.category`) viene applicata solo se
 * definita e diversa da `'ALL'` (convenzione della route `/api/objects`:
 * `'ALL'` = nessun filtro categoria).
 *
 * L'helper NON gestisce `select`, `include`, paginazione né ordinamento:
 * il caller compone il `findMany` con il `where` ritornato + i suoi
 * parametri specifici (es. `take`, `cursor`, `include`).
 *
 * @param recipientId       id del recipient
 * @param extra.category    filtro categoria opzionale; omesso se `undefined`
 *                          o `'ALL'`
 * @returns oggetto con `where` (`Prisma.ObjectWhereInput | null`) e
 *          `scope` (`RecipientScope`). `where === null` quando lo scope è
 *          `no-entity` o `unauthorized`.
 *
 * @example
 *   const { where, scope } = await buildObjectWhereForRecipient(session.id);
 *   if (!where) {
 *     return NextResponse.json({ objects: [] });
 *   }
 *   const objects = await prisma.object.findMany({
 *     where,
 *     orderBy: { createdAt: 'desc' },
 *     include: { donor: { select: { donorProfile: { select: { level: true } } } } },
 *   });
 */
export async function buildObjectWhereForRecipient(
  recipientId: string,
  extra?: { category?: string }
): Promise<{ where: Prisma.ObjectWhereInput | null; scope: RecipientScope }> {
  const scope = await getRecipientScope(recipientId);

  if (scope.kind !== 'ok') {
    return { where: null, scope };
  }

  // Recupera gli ID degli oggetti per cui il recipient ha già fatto richiesta.
  const requestedObjectIds = await prisma.request.findMany({
    where: { recipientId },
    select: { objectId: true },
  }).then((rows) => rows.map((r) => r.objectId));

  const where: Prisma.ObjectWhereInput = {
    status: 'AVAILABLE',
    intermediaryId: scope.referenceEntityId,
    NOT: {
      OR: [
        { id: { in: requestedObjectIds } },
        { donorId: recipientId },
      ],
    },
  };

  if (extra?.category && extra.category !== 'ALL') {
    where.category = extra.category;
  }

  return { where, scope };
}