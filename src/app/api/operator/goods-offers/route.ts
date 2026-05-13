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

    if (!hasAnyPermission(operator.role, operator.permissions, ['OBJECT_RECEIVE', 'OBJECT_DELIVER', 'RECIPIENT_AUTHORIZE'])) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    // Get goods offers that are ACCEPTED (donor delivered to org, waiting for pickup)
    // These are linked to GoodsRequests where intermediaryId is the operator's org
    const offers = await prisma.goodsOffer.findMany({
      where: {
        request: {
          intermediaryId: session.organizationId,
          status: 'DELIVERED',
        },
      },
      include: {
        offeredBy: {
          select: { id: true, name: true, email: true },
        },
        request: {
          select: {
            id: true,
            title: true,
            category: true,
            beneficiary: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ offers });
  } catch (error) {
    console.error('Operator goods offers GET error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}