import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

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

export async function GET(
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

    const availability = await prisma.multiAvailability.findUnique({
      where: { id },
      include: {
        requests: {
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
          orderBy: { needScoreSnapshot: 'desc' },
        },
        organization: {
          select: { id: true, name: true }
        }
      },
    });

    if (!availability) {
      return NextResponse.json({ error: 'Disponibilità non trovata' }, { status: 404 });
    }

    if (availability.organizationId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Conta gli assegnati direttamente dal DB
    const assignedCount = await prisma.multiAvailabilityRequest.count({
      where: {
        multiAvailabilityId: id,
        status: { in: ['ASSIGNED', 'FULFILLED'] }
      }
    });

    console.log(`[DEBUG] MultiAvail ${id}: assignedQty in DB = ${assignedCount}, field = ${availability.assignedQty}`);

    const result = {
      availability: {
        ...availability,
        assignedQty: assignedCount,
      }
    };

    console.log('[DEBUG] Returning availability with assignedQty:', result.availability.assignedQty);

    return NextResponse.json(result);
  } catch (error) {
    console.error('MultiAvailability detail error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(
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

    const availability = await prisma.multiAvailability.findUnique({
      where: { id },
    });

    if (!availability) {
      return NextResponse.json({ error: 'Disponibilità non trovata' }, { status: 404 });
    }

    if (availability.organizationId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, availableQty, deadline, exhaustMessage, status } = body;

    const updated = await prisma.multiAvailability.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(availableQty !== undefined && { availableQty }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(exhaustMessage !== undefined && { exhaustMessage }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json({ availability: updated });
  } catch (error) {
    console.error('MultiAvailability update error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function DELETE(
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

    const availability = await prisma.multiAvailability.findUnique({
      where: { id },
    });

    if (!availability) {
      return NextResponse.json({ error: 'Disponibilità non trovata' }, { status: 404 });
    }

    if (availability.organizationId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Solo se non ci sono richieste assegnate già in corso
    const assignedCount = await prisma.multiAvailabilityRequest.count({
      where: {
        multiAvailabilityId: id,
        status: { in: ['ASSIGNED', 'FULFILLED'] }
      }
    });

    if (assignedCount > 0) {
      return NextResponse.json({
        error: 'Impossibile eliminare: ci sono richieste già assegnate o evase'
      }, { status: 400 });
    }

    await prisma.multiAvailability.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('MultiAvailability delete error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}