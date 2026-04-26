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

export async function GET() {
  try {
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

    // Check permission
    if (!hasAnyPermission(operator.role, operator.permissions, ['RECIPIENT_AUTHORIZE'])) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    // Get donors belonging to this organization as intermediaries
    // Donors donate objects to the organization
    const donors = await prisma.user.findMany({
      where: {
        role: 'DONOR',
        donatedObjects: {
          some: {
            intermediaryId: session.organizationId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        canProvideServices: true,
        canProvideServicesAt: true,
        createdAt: true,
        donorProfile: {
          select: {
            totalDonations: true,
            level: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ donors });
  } catch (error) {
    console.error('Operator donors error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
