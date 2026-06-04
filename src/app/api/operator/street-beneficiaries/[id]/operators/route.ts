import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
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

// POST /api/operator/street-beneficiaries/[id]/operators - assegna altri street operators
export const POST = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {

  const { id } = await params;
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

  if (!operator.isStreetOperator) {
    return NextResponse.json({ error: 'Non è un operatore di strada' }, { status: 403 });
  }

  // Verifica che il beneficiario esista e sia street-managed
  const beneficiary = await prisma.user.findUnique({
    where: { id },
  });

  if (!beneficiary || !beneficiary.isStreetManaged) {
    return NextResponse.json({ error: 'Beneficiario non trovato o non è street-managed' }, { status: 404 });
  }

  const { operatorIds } = await request.json();

  if (!Array.isArray(operatorIds)) {
    return NextResponse.json({ error: 'operatorIds deve essere un array' }, { status: 400 });
  }

  // Verifica che gli operatori siano street operators validi
  const operators = await prisma.operator.findMany({
    where: {
      id: { in: operatorIds },
      isStreetOperator: true,
      active: true,
    },
  });

  if (operators.length !== operatorIds.length) {
    return NextResponse.json({ error: 'Alcuni operatori non sono validi o non sono street operators' }, { status: 400 });
  }

  // Verifica che siano della stessa organizzazione
  const sameOrg = operators.every(op => op.organizationId === session.organizationId);
  if (!sameOrg) {
    return NextResponse.json({ error: 'Tutti gli operatori devono appartenere allo stesso ente' }, { status: 400 });
  }

  // Aggiungi le associazioni (ignora duplicati)
  // Prima elimina quelle esistenti non più selezionate
  await prisma.streetOperatorBeneficiary.deleteMany({
    where: {
      beneficiaryId: id,
      streetOperatorId: { notIn: operatorIds },
    },
  });

  // Poi aggiungi le nuove
  await prisma.streetOperatorBeneficiary.createMany({
    data: operatorIds.map(streetOperatorId => ({
      streetOperatorId,
      beneficiaryId: id,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ success: true });

}, 'POST /api/operator/street-beneficiaries/[id]/operators');

// GET /api/operator/street-beneficiaries/[id]/operators - lista street operators associati
export const GET = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {

  const { id } = await params;
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

  if (!operator.isStreetOperator) {
    return NextResponse.json({ error: 'Non è un operatore di strada' }, { status: 403 });
  }

  // Verifica che il beneficiario esista e sia street-managed
  const beneficiary = await prisma.user.findUnique({
    where: { id },
  });

  if (!beneficiary || !beneficiary.isStreetManaged) {
    return NextResponse.json({ error: 'Beneficiario non trovato o non è street-managed' }, { status: 404 });
  }

  const assignments = await prisma.streetOperatorBeneficiary.findMany({
    where: { beneficiaryId: id },
    include: {
      streetOperator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  const operators = assignments.map(a => ({
    ...a.streetOperator,
    assignedAt: a.assignedAt,
  }));

  return NextResponse.json({ operators });

}, 'GET /api/operator/street-beneficiaries/[id]/operators');