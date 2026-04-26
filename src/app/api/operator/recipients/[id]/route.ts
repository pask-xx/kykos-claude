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

    if (!hasAnyPermission(operator.role, operator.permissions, ['RECIPIENT_AUTHORIZE'])) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    // Get recipient with basic info
    const recipient = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        fiscalCode: true,
        birthDate: true,
        address: true,
        houseNumber: true,
        cap: true,
        city: true,
        province: true,
        referenceEntityId: true,
        isee: true,
        authorized: true,
        authorizedAt: true,
        canRequestGoods: true,
        canRequestServices: true,
        createdAt: true,
      },
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Ricevente non trovato' }, { status: 404 });
    }

    if (recipient.referenceEntityId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Get all requests made by this recipient
    const requests = await prisma.request.findMany({
      where: { recipientId: id },
      include: {
        object: {
          select: {
            id: true,
            title: true,
            category: true,
            condition: true,
            status: true,
            imageUrls: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get all donations received by this recipient
    const donations = await prisma.donation.findMany({
      where: { recipientId: id },
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
        request: {
          select: {
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate statistics
    const totalRequests = requests.length;
    const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
    const approvedRequests = requests.filter(r => r.status === 'APPROVED').length;
    const rejectedRequests = requests.filter(r => r.status === 'REJECTED').length;
    const expiredRequests = requests.filter(r => r.status === 'EXPIRED').length;

    const totalDonations = donations.length;

    // Category breakdown for received donations
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

    // Condition breakdown for received donations
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

    // Requests by category (what recipient has requested)
    const requestedCategories: Record<string, number> = {};
    requests.forEach(r => {
      const cat = r.object.category;
      requestedCategories[cat] = (requestedCategories[cat] || 0) + 1;
    });

    // Recent activity (last 6 donations)
    const recentDonations = donations.slice(0, 6).map(d => ({
      id: d.id,
      objectTitle: d.object.title,
      category: d.object.category,
      condition: d.object.condition,
      imageUrl: d.object.imageUrls?.[0] || null,
      receivedAt: d.createdAt,
    }));

    return NextResponse.json({
      recipient,
      stats: {
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        expiredRequests,
        totalDonations,
        categoryBreakdown,
        conditionBreakdown,
        requestedCategories,
        recentDonations,
      },
    });
  } catch (error) {
    console.error('Recipient detail error:', error);
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

    if (!hasAnyPermission(operator.role, operator.permissions, ['RECIPIENT_AUTHORIZE'])) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const recipient = await prisma.user.findUnique({
      where: { id },
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Ricevente non trovato' }, { status: 404 });
    }

    if (recipient.referenceEntityId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const { authorized, canRequestGoods, canRequestServices } = await request.json();

    await prisma.user.update({
      where: { id },
      data: {
        authorized: authorized !== undefined ? authorized : recipient.authorized,
        authorizedAt: authorized ? (recipient.authorizedAt || new Date()) : null,
        canRequestGoods: canRequestGoods !== undefined ? canRequestGoods : recipient.canRequestGoods,
        canRequestServices: canRequestServices !== undefined ? canRequestServices : recipient.canRequestServices,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Recipient update error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
