import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(
  request: NextRequest,
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

    // Check permission
    if (!hasAnyPermission(operator.role, operator.permissions, ['RECIPIENT_AUTHORIZE'])) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const donor = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        fiscalCode: true,
        birthDate: true,
        address: true,
        houseNumber: true,
        cap: true,
        city: true,
        province: true,
        canProvideServices: true,
        canProvideServicesAt: true,
        createdAt: true,
        donorProfile: {
          select: {
            totalDonations: true,
            totalObjects: true,
            level: true,
          },
        },
      },
    });

    if (!donor) {
      return NextResponse.json({ error: 'Donatore non trovato' }, { status: 404 });
    }

    // Verify donor donates through this organization
    const hasObjectsHere = await prisma.object.count({
      where: {
        donorId: id,
        intermediaryId: session.organizationId,
      },
    });

    if (hasObjectsHere === 0) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Get stats for this donor
    const totalDonations = await prisma.donation.count({
      where: {
        donorId: id,
        object: {
          intermediaryId: session.organizationId,
        },
      },
    });

    const totalObjects = await prisma.object.count({
      where: {
        donorId: id,
        intermediaryId: session.organizationId,
      },
    });

    // Get service request IDs for this organization
    const serviceRequests = await prisma.goodsRequest.findMany({
      where: {
        type: 'SERVICES',
        intermediaryId: session.organizationId,
      },
      select: { id: true },
    });
    const serviceRequestIds = serviceRequests.map(r => r.id);

    const totalServiceOffers = await prisma.goodsOffer.count({
      where: {
        offeredById: id,
        requestId: { in: serviceRequestIds },
      },
    });

    return NextResponse.json({
      donor,
      stats: {
        totalDonations,
        totalObjects,
        totalServiceOffers,
      },
    });
  } catch (error) {
    console.error('Operator donor detail error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
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

    // Check permission
    if (!hasAnyPermission(operator.role, operator.permissions, ['RECIPIENT_AUTHORIZE'])) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const donor = await prisma.user.findUnique({
      where: { id },
    });

    if (!donor) {
      return NextResponse.json({ error: 'Donatore non trovato' }, { status: 404 });
    }

    // Verify donor donates through this organization
    const hasObjectsHere = await prisma.object.count({
      where: {
        donorId: id,
        intermediaryId: session.organizationId,
      },
    });

    if (hasObjectsHere === 0) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const { canProvideServices } = await request.json();

    await prisma.user.update({
      where: { id },
      data: {
        canProvideServices: canProvideServices !== undefined ? canProvideServices : donor.canProvideServices,
        canProvideServicesAt: canProvideServices ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Operator donor PATCH error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
