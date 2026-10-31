import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { Category, Condition } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getJwtSecret } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';
import { hasAnyPermission } from '@/lib/permissions';

const JWT_SECRET = getJwtSecret();

/** Limite foto: allineato a `MAX_IMAGES` del form donatore. */
const MAX_IMAGES = 5;

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
  const statusFilter = searchParams.get('status');

  const objects = await prisma.object.findMany({
    where: {
      publishedByOrgId: session.organizationId,
      ...(statusFilter && statusFilter !== 'ALL' ? { status: statusFilter as never } : {}),
    },
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
      _count: {
        select: {
          requests: { where: { status: { in: ['PENDING', 'APPROVED'] } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ objects });
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

  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'Il titolo è obbligatorio' }, { status: 400 });
  }

  if (!category || !Object.values(Category).includes(category)) {
    return NextResponse.json({ error: 'Categoria non valida' }, { status: 400 });
  }

  if (!condition || !Object.values(Condition).includes(condition)) {
    return NextResponse.json({ error: 'Condizione non valida' }, { status: 400 });
  }

  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return NextResponse.json({ error: 'Almeno una foto è obbligatoria' }, { status: 400 });
  }

  if (imageUrls.length > MAX_IMAGES) {
    return NextResponse.json({ error: `Massimo ${MAX_IMAGES} foto` }, { status: 400 });
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
