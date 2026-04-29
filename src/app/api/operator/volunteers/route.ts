import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hasAnyPermission } from '@/lib/permissions';
import { VolunteerStatus } from '@prisma/client';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

interface OperatorSession {
  operatorId: string;
  organizationId: string;
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

    // Get operator to check permissions
    const operator = await prisma.operator.findUnique({
      where: { id: session.operatorId },
    });

    if (!operator || !hasAnyPermission(operator.role, operator.permissions, ['VOLUNTEER_MANAGE', 'ORGANIZATION_ADMIN'])) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    // Get pending volunteers for this organization
    const pendingVolunteers = await prisma.volunteerAssociation.findMany({
      where: {
        organizationId: session.organizationId,
        status: VolunteerStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get approved volunteers
    const approvedVolunteers = await prisma.volunteerAssociation.findMany({
      where: {
        organizationId: session.organizationId,
        status: VolunteerStatus.APPROVED,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            city: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    // Include cvUrl and profile in response (Prisma returns all fields by default with include)
    const approvedWithCv = approvedVolunteers.map(v => ({
      ...v,
      cvUrl: v.cvUrl,
      profile: v.profile,
    }));

    return NextResponse.json({
      pending: pendingVolunteers,
      approved: approvedWithCv,
    });
  } catch (error) {
    console.error('Operator volunteers GET error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}