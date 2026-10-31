import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { Category, Condition, ObjectStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getJwtSecret } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';
import { hasAnyPermission } from '@/lib/permissions';
import { parseLocalDateBoundary, resolveEntityDeliveredAt } from '@/lib/entity-history';
import { validateEntityObjectInput } from '@/lib/entity-object-rules';

const JWT_SECRET = getJwtSecret();

/**
 * Tetto di oggetti restituibili in una pagina di elenco.
 * Lo storico di un ente è bounded per natura (un magazzino), ma il tetto
 * evita di caricare a memoria l'intero storico di un ente molto attivo.
 */
const MAX_OBJECTS_PER_PAGE = 1000;

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

/**
 * GET /api/operator/entity-objects
 * Lista le disponibilità pubblicate dall'ente (l'ente è il donatore).
 *
 * Query params:
 * - `status`: uno dei valori di `ObjectStatus`, oppure `ALL`.
 *   DEFAULT: tutto tranne `DONATED` e `CANCELLED` — le disponibilità
 *   consegnate si consultano nello storico (`?status=DONATED`, pagina
 *   /operator/entity-history), quelle revocate nella pagina dedicata
 *   (`?status=CANCELLED`, pagina /operator/entity-revoked).
 * - `search`: testo libero su titolo, descrizione, posizione di deposito.
 * - `category`: categoria valida (filtro per lo storico).
 * - `from` / `to`: intervallo `YYYY-MM-DD` sulla data di consegna
 *   (usato solo dallo storico).
 */
export const GET = withErrorHandler(async (request: Request) => {
  const session = await getOperatorSession();

  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const operator = await prisma.operator.findUnique({
    where: { id: session.operatorId },
  });

  if (!operator || !operator.active) {
    return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
  }

  if (!hasAnyPermission(operator.role, operator.permissions, ['ORGANIZATION_ADMIN'])) {
    return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status');
  const searchParam = searchParams.get('search')?.trim() || null;
  const categoryParam = searchParams.get('category');

  let statusFilter: ObjectStatus | undefined;
  if (statusParam && statusParam !== 'ALL') {
    if (!Object.values(ObjectStatus).includes(statusParam as ObjectStatus)) {
      return NextResponse.json({ error: 'Stato non valido' }, { status: 400 });
    }
    statusFilter = statusParam as ObjectStatus;
  }

  if (categoryParam && !Object.values(Category).includes(categoryParam as Category)) {
    return NextResponse.json({ error: 'Categoria non valida' }, { status: 400 });
  }

  const where: Prisma.ObjectWhereInput = {
    publishedByOrgId: session.organizationId,
    // Default: nel magazzino ci sono solo le disponibilità ancora
    // pubblicabili. Le consegnate stanno nello storico, le revocate
    // nella pagina dedicata.
    status: statusFilter ?? { notIn: ['DONATED', 'CANCELLED'] },
    ...(searchParam
      ? {
          OR: [
            { title: { contains: searchParam, mode: 'insensitive' } },
            { description: { contains: searchParam, mode: 'insensitive' } },
            { depositLocation: { contains: searchParam, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(categoryParam ? { category: categoryParam as Category } : {}),
  };

  const objects = await prisma.object.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      condition: true,
      imageUrls: true,
      status: true,
      depositLocation: true,
      depositNotes: true,
      createdAt: true,
      updatedAt: true,
      // Data di ritiro/consegna: `Donation.deliveredAt` se valorizzata,
      // altrimenti `updatedAt` (ultimo cambio di stato → DONATED).
      donation: { select: { deliveredAt: true } },
      _count: {
        select: {
          requests: { where: { status: { in: ['PENDING', 'APPROVED'] } } },
        },
      },
    },
    orderBy: statusFilter === 'DONATED' ? { updatedAt: 'desc' } : { createdAt: 'desc' },
    take: MAX_OBJECTS_PER_PAGE,
  });

  // Filtro per intervallo di date: applicato sulla data di consegna
  // calcolata (non filtrabile in SQL perché è un fallback COALESCE).
  const from = parseLocalDateBoundary(searchParams.get('from'), false);
  const to = parseLocalDateBoundary(searchParams.get('to'), true);

  const items = objects
    .map((object) => ({
      ...object,
      deliveredAt: resolveEntityDeliveredAt(object.donation?.deliveredAt, object.updatedAt),
    }))
    .filter((object) => {
      if (!from && !to) return true;
      const time = new Date(object.deliveredAt).getTime();
      if (Number.isNaN(time)) return false;
      if (from && time < from.getTime()) return false;
      if (to && time > to.getTime()) return false;
      return true;
    });

  return NextResponse.json({
    objects: items,
    total: items.length,
    truncated: objects.length >= MAX_OBJECTS_PER_PAGE,
  });
}, 'GET /api/operator/entity-objects');

/**
 * POST /api/operator/entity-objects
 * Pubblica una nuova disponibilità dell'ente (oggetto giacente in deposito).
 *
 * L'ente è il donatore: `donorId` punta all'account dell'ente
 * (`Organization.userId`) e `publishedByOrgId` marca l'oggetto come
 * disponibilità dell'ente. Non viene creato alcun DonorProfile (l'ente non
 * ha livelli donatore).
 */
export const POST = withErrorHandler(async (request: Request) => {
  const session = await getOperatorSession();

  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const operator = await prisma.operator.findUnique({
    where: { id: session.operatorId },
  });

  if (!operator || !operator.active) {
    return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
  }

  if (!hasAnyPermission(operator.role, operator.permissions, ['ORGANIZATION_ADMIN'])) {
    return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { id: true, name: true, userId: true },
  });

  if (!org) {
    return NextResponse.json({ error: 'Ente non trovato' }, { status: 404 });
  }

  const body = await request.json();
  const { title, description, category, condition, imageUrls, depositLocation, depositNotes } = body;

  // Validazione condivisa con la modifica (stessi messaggi, stessa regola).
  const validationError = validateEntityObjectInput(body);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const object = await prisma.object.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      category: category as Category,
      condition: condition as Condition,
      imageUrls,
      // L'oggetto è già in giacenza in sede: la posizione di deposito si
      // conosce alla pubblicazione, non al momento della consegna.
      depositLocation: depositLocation?.trim() || null,
      depositNotes: depositNotes?.trim() || null,
      // L'ente è il donatore.
      donorId: org.userId,
      intermediaryId: org.id,
      publishedByOrgId: org.id,
      status: 'AVAILABLE',
    },
  });

  return NextResponse.json({ object }, { status: 201 });
}, 'POST /api/operator/entity-objects');
