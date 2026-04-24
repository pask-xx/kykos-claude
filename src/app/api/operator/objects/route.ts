import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hasPermission, hasAnyPermission } from '@/lib/permissions';

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

    // Check permission
    if (!hasAnyPermission(operator.role, operator.permissions, ['OBJECT_RECEIVE', 'OBJECT_DELIVER'])) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const objects = await prisma.object.findMany({
      where: { intermediaryId: session.organizationId },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        condition: true,
        status: true,
        imageUrls: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ objects });
  } catch (error) {
    console.error('Operator objects error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
