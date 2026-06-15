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

export const GET = withErrorHandler(async () => {
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
      nickname: true,
      name: true,
      email: true,
      firstName: true,
      lastName: true,
      canProvideServices: true,
      canProvideServicesAt: true,
      createdAt: true,
      profileImageUrl: true,
      donorProfile: {
        select: {
          level: true,
        },
      },
      donatedObjects: {
        where: { intermediaryId: session.organizationId },
        select: {
          donation: { select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Shape: deriva totalDonations per donatore contando le Donation
  // reali verso questo ente (transazioni effettive, non cached).
  // NB: `donorProfile.totalDonations` è una colonna cached che NON viene
  // mai aggiornata (vedi Fase 36.5 bug report) — leggiamo il dato vero
  // dalle relazioni Donation. Scope: solo oggetti donati a questo ente.
  // Ogni Object ha 0 o 1 Donation (relazione 1-a-1 via objectId @unique).
  const donorsWithCount = donors.map((d) => ({
    id: d.id,
    nickname: d.nickname,
    name: d.name,
    email: d.email,
    firstName: d.firstName,
    lastName: d.lastName,
    canProvideServices: d.canProvideServices,
    canProvideServicesAt: d.canProvideServicesAt,
    createdAt: d.createdAt,
    profileImageUrl: d.profileImageUrl,
    donorProfile: d.donorProfile
      ? {
          totalDonations: d.donatedObjects.reduce<number>(
            (sum, obj) => sum + (obj.donation ? 1 : 0),
            0,
          ),
          level: d.donorProfile.level,
        }
      : null,
  }));

  return NextResponse.json({ donors: donorsWithCount });
}, 'GET /api/operator/donors');
