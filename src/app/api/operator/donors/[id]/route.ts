import { NextRequest, NextResponse } from 'next/server';
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

export const GET = withErrorHandler(async (
  request: NextRequest,
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

  // Check permission
  if (!hasAnyPermission(operator.role, operator.permissions, ['RECIPIENT_AUTHORIZE'])) {
    return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
  }

  const donor = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      nickname: true,
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

  // Get all donations made by this donor (for category/condition breakdown + recent)
  const donations = await prisma.donation.findMany({
    where: {
      donorId: id,
      object: {
        intermediaryId: session.organizationId,
      },
    },
    include: {
      object: {
        select: {
          id: true,
          title: true,
          category: true,
          condition: true,
          imageUrls: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Category breakdown for donations
  const categoryBreakdown: Record<string, { count: number; percentage: number }> = {};
  donations.forEach(d => {
    const cat = d.object.category;
    if (!categoryBreakdown[cat]) {
      categoryBreakdown[cat] = { count: 0, percentage: 0 };
    }
    categoryBreakdown[cat].count++;
  });
  Object.keys(categoryBreakdown).forEach(cat => {
    categoryBreakdown[cat].percentage = totalDonations > 0
      ? Math.round((categoryBreakdown[cat].count / totalDonations) * 100)
      : 0;
  });

  // Condition breakdown for donations
  const conditionBreakdown: Record<string, { count: number; percentage: number }> = {};
  donations.forEach(d => {
    const cond = d.object.condition;
    if (!conditionBreakdown[cond]) {
      conditionBreakdown[cond] = { count: 0, percentage: 0 };
    }
    conditionBreakdown[cond].count++;
  });
  Object.keys(conditionBreakdown).forEach(cond => {
    conditionBreakdown[cond].percentage = totalDonations > 0
      ? Math.round((conditionBreakdown[cond].count / totalDonations) * 100)
      : 0;
  });

  // Donated categories (with count, for chip display)
  const donatedCategories: Record<string, number> = {};
  donations.forEach(d => {
    const cat = d.object.category;
    donatedCategories[cat] = (donatedCategories[cat] || 0) + 1;
  });

  // Recent donations (last 6)
  const recentDonations = donations.slice(0, 6).map(d => ({
    id: d.id,
    objectTitle: d.object.title,
    category: d.object.category,
    condition: d.object.condition,
    imageUrl: d.object.imageUrls?.[0] || null,
    receivedAt: d.createdAt,
  }));

  return NextResponse.json({
    donor,
    stats: {
      totalDonations,
      totalObjects,
      totalServiceOffers,
      categoryBreakdown,
      conditionBreakdown,
      donatedCategories,
      recentDonations,
    },
  });

}, 'GET /api/operator/donors/[id]');

export const PATCH = withErrorHandler(async (
  request: NextRequest,
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

}, 'PATCH /api/operator/donors/[id]');
