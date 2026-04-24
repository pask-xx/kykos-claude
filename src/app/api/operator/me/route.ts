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

export async function GET() {
  try {
    const session = await getOperatorSession();

    if (!session) {
      return NextResponse.json({ operator: null });
    }

    const operator = await prisma.operator.findUnique({
      where: { id: session.operatorId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            code: true,
          },
        },
      },
    });

    if (!operator || !operator.active) {
      return NextResponse.json({ operator: null });
    }

    return NextResponse.json({
      operator: {
        id: operator.id,
        username: operator.username,
        email: operator.email,
        phone: operator.phone,
        firstName: operator.firstName,
        lastName: operator.lastName,
        role: operator.role,
        organization: operator.organization,
      },
    });
  } catch (error) {
    console.error('Operator me error:', error);
    return NextResponse.json(
      { error: 'Errore interno' },
      { status: 500 }
    );
  }
}
