import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hasAnyPermission } from '@/lib/permissions';
import { randomBytes } from 'crypto';

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

// POST /api/operator/multi-availability/[id]/assign - Assegna beneficiari selezionati
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    if (!hasAnyPermission(operator.role, operator.permissions, ['ORGANIZATION_ADMIN'])) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const availability = await prisma.multiAvailability.findUnique({
      where: { id },
    });

    if (!availability || availability.organizationId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const { beneficiaryIds } = body;

    if (!Array.isArray(beneficiaryIds)) {
      return NextResponse.json({ error: 'beneficiaryIds deve essere un array' }, { status: 400 });
    }

    // Verifica che non si superi la quantità disponibile
    const currentlyAssigned = await prisma.multiAvailabilityRequest.count({
      where: {
        multiAvailabilityId: id,
        status: 'ASSIGNED',
      }
    });

    const newAssignments = beneficiaryIds.length;
    if (currentlyAssigned + newAssignments > availability.availableQty) {
      return NextResponse.json({
        error: `Superata la quantità disponibile. Disponibili: ${availability.availableQty - currentlyAssigned}`
      }, { status: 400 });
    }

    // Genera QR code per ogni beneficiario assegnato
    const qrCodes: string[] = [];
    for (const beneficiaryId of beneficiaryIds) {
      const qrCode = `MA-${id.slice(0, 8)}-${beneficiaryId.slice(0, 8)}-${randomBytes(4).toString('hex').toUpperCase()}`;

      // Ottieni lo score attuale del beneficiario
      const beneficiary = await prisma.user.findUnique({
        where: { id: beneficiaryId },
        select: { needScore: true }
      });

      const req = await prisma.multiAvailabilityRequest.upsert({
        where: {
          multiAvailabilityId_beneficiaryId: {
            multiAvailabilityId: id,
            beneficiaryId,
          }
        },
        update: {
          status: 'ASSIGNED',
          qrCode,
        },
        create: {
          multiAvailabilityId: id,
          beneficiaryId,
          needScoreSnapshot: beneficiary?.needScore ?? 50,
          status: 'ASSIGNED',
          qrCode,
        },
      });
      qrCodes.push(qrCode);
    }

    // Aggiorna assignedQty
    const newAssignedCount = await prisma.multiAvailabilityRequest.count({
      where: {
        multiAvailabilityId: id,
        status: { in: ['ASSIGNED', 'FULFILLED'] }
      }
    });

    await prisma.multiAvailability.update({
      where: { id },
      data: { assignedQty: newAssignedCount },
    });

    return NextResponse.json({
      success: true,
      assigned: beneficiaryIds.length,
      qrCodes,
    });
  } catch (error) {
    console.error('MultiAvailability assign error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}