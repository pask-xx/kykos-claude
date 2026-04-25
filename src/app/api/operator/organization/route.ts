import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

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

    // Only ADMIN can view organization settings
    if (!hasPermission(operator.role, operator.permissions, 'ORGANIZATION_ADMIN')) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      select: {
        id: true,
        name: true,
        type: true,
        address: true,
        houseNumber: true,
        cap: true,
        city: true,
        province: true,
        phone: true,
        email: true,
        latitude: true,
        longitude: true,
        verified: true,
        autoApproveRequests: true,
        hoursInfo: true,
      },
    });

    return NextResponse.json({ organization });
  } catch (error) {
    console.error('Operator organization GET error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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

    // Only ADMIN can update organization settings
    if (!hasPermission(operator.role, operator.permissions, 'ORGANIZATION_ADMIN')) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const body = await request.json();
    const { hoursInfo, autoApproveRequests } = body;

    const updateData: Record<string, unknown> = {};

    if (hoursInfo !== undefined) {
      updateData.hoursInfo = hoursInfo;
    }

    if (autoApproveRequests !== undefined) {
      updateData.autoApproveRequests = autoApproveRequests;
    }

    await prisma.organization.update({
      where: { id: session.organizationId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Operator organization PATCH error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
