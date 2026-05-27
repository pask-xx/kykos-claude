import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hasAnyPermission } from '@/lib/permissions';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

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

// POST /api/operator/multi-avail-pickup/[requestId]/complete
// Completa il ritiro di una richiesta multi-availability
export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
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

    // Trova la richiesta
    const multiAvailRequest = await prisma.multiAvailabilityRequest.findUnique({
      where: { id: requestId },
      include: {
        multiAvailability: {
          select: {
            id: true,
            organizationId: true,
          }
        }
      }
    });

    if (!multiAvailRequest) {
      return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
    }

    // Verifica che appartenga alla stessa organizzazione
    if (multiAvailRequest.multiAvailability.organizationId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Verifica che sia in stato ASSIGNED
    if (multiAvailRequest.status !== 'ASSIGNED') {
      return NextResponse.json({ error: 'Stato non valido per il completamento' }, { status: 400 });
    }

    // Aggiorna lo stato a FULFILLED
    await prisma.multiAvailabilityRequest.update({
      where: { id: requestId },
      data: {
        status: 'FULFILLED',
        fulfilledAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('MultiAvail pickup complete error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}