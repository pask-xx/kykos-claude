import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hasAnyPermission } from '@/lib/permissions';
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

// GET /api/operator/multi-availability/[id]/requests - Lista richieste
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

  const availability = await prisma.multiAvailability.findUnique({
    where: { id },
  });

  if (!availability || availability.organizationId !== session.organizationId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const sortBy = searchParams.get('sortBy') || 'needScore'; // 'needScore' or 'requestedAt'

  const requests = await prisma.multiAvailabilityRequest.findMany({
    where: { multiAvailabilityId: id },
    include: {
      beneficiary: {
        select: {
          id: true,
          nickname: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          needScore: true,
        }
      }
    },
    orderBy: sortBy === 'requestedAt'
      ? { requestedAt: 'asc' }
      : { needScoreSnapshot: 'desc' },
  });

  return NextResponse.json({
    requests,
    stats: {
      total: requests.length,
      pending: requests.filter(r => r.status === 'PENDING').length,
      assigned: requests.filter(r => r.status === 'ASSIGNED').length,
      fulfilled: requests.filter(r => r.status === 'FULFILLED').length,
      rejected: requests.filter(r => r.status === 'REJECTED').length,
    }
  });

}, 'GET /api/operator/multi-availability/[id]/requests');

// POST /api/operator/multi-availability/[id]/requests - Crea richiesta (per beneficiario)
export const POST = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {

  const { id } = await params;
  const session = await getOperatorSession();

  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  // Verifica che la disponibilità esista e sia aperta
  const availability = await prisma.multiAvailability.findUnique({
    where: { id },
  });

  if (!availability) {
    return NextResponse.json({ error: 'Disponibilità non trovata' }, { status: 404 });
  }

  if (availability.status !== 'OPEN') {
    return NextResponse.json({ error: 'La disponibilità non è più aperta' }, { status: 400 });
  }

  // Get user from session cookie (not operator session)
  const cookieStore = await cookies();
  const userToken = cookieStore.get('session')?.value;

  if (!userToken) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { payload } = await jwtVerify(userToken, JWT_SECRET);
  const userId = payload.userId as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.referenceEntityId !== session.organizationId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  // Check if request already exists
  const existingRequest = await prisma.multiAvailabilityRequest.findUnique({
    where: {
      multiAvailabilityId_beneficiaryId: {
        multiAvailabilityId: id,
        beneficiaryId: userId,
      }
    }
  });

  if (existingRequest) {
    return NextResponse.json({ error: 'Hai già fatto richiesta per questa disponibilità' }, { status: 400 });
  }

  const newRequest = await prisma.multiAvailabilityRequest.create({
    data: {
      multiAvailabilityId: id,
      beneficiaryId: userId,
      needScoreSnapshot: user.needScore,
    },
  });

  return NextResponse.json({ request: newRequest }, { status: 201 });

}, 'POST /api/operator/multi-availability/[id]/requests');