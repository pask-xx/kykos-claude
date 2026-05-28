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
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const operator = await prisma.operator.findUnique({
      where: { id: session.operatorId },
    });

    if (!operator || !operator.active) {
      return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
    }

    if (!operator.isStreetOperator) {
      return NextResponse.json({ error: 'Solo gli operatori di strada possono accedere' }, { status: 403 });
    }

    // Street operator vede TUTTI gli oggetti della diocesi
    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      select: { dioceseId: true },
    });

    if (!org?.dioceseId) {
      return NextResponse.json({ error: 'Diocesi non trovata' }, { status: 404 });
    }

    const objects = await prisma.object.findMany({
      where: {
        intermediary: {
          dioceseId: org.dioceseId,
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        condition: true,
        status: true,
        imageUrls: true,
        createdAt: true,
        depositLocation: true,
        donor: { select: { id: true, nickname: true, name: true } },
        intermediary: {
          select: { id: true, name: true },
        },
        requests: {
          where: { status: 'APPROVED' },
          select: {
            id: true,
            recipient: { select: { id: true, nickname: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ objects });
  } catch (error) {
    console.error('Diocese objects error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}