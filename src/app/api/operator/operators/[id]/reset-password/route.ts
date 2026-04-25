import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { hashPassword } from '@/lib/auth';

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

export async function POST(request: Request) {
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

    if (!hasPermission(operator.role, operator.permissions, 'ORGANIZATION_ADMIN')) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const { operatorId } = await request.json();

    if (!operatorId) {
      return NextResponse.json({ error: 'ID operatore mancante' }, { status: 400 });
    }

    // Get operator to reset
    const targetOperator = await prisma.operator.findUnique({
      where: { id: operatorId },
    });

    if (!targetOperator || targetOperator.organizationId !== session.organizationId) {
      return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
    }

    // Reset password to temporary one
    const tempPassword = 'cambiamisubito';
    const newHash = await hashPassword(tempPassword);

    await prisma.operator.update({
      where: { id: operatorId },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({
      success: true,
      message: `Password resettata. La nuova password temporanea è: ${tempPassword}`,
      temporaryPassword: tempPassword,
    });
  } catch (error) {
    console.error('Operator password reset error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
