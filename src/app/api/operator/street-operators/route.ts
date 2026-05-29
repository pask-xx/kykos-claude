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

// GET /api/operator/street-operators - lista tutti gli street operators dell'ente
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

    if (!operator.isStreetOperator) {
      return NextResponse.json({ error: 'Non è un operatore di strada' }, { status: 403 });
    }

    const streetOperators = await prisma.operator.findMany({
      where: {
        organizationId: session.organizationId,
        isStreetOperator: true,
        active: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
      orderBy: { lastName: 'asc' },
    });

    return NextResponse.json({ streetOperators });
  } catch (error) {
    console.error('Street operators error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
