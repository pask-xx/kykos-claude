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

    if (!hasPermission(operator.role, operator.permissions, 'OBJECT_DELIVER')) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const { objectId } = await request.json();

    if (!objectId) {
      return NextResponse.json({ error: 'objectId mancante' }, { status: 400 });
    }

    // Find object and verify it belongs to this organization
    const object = await prisma.object.findUnique({
      where: { id: objectId },
    });

    if (!object) {
      return NextResponse.json({ error: 'Oggetto non trovato' }, { status: 404 });
    }

    if (object.intermediaryId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    if (object.status !== 'DEPOSITED') {
      return NextResponse.json({ error: 'Oggetto non e\' in stato di deposito' }, { status: 400 });
    }

    // Mark as DONATED (final delivery)
    await prisma.object.update({
      where: { id: objectId },
      data: { status: 'DONATED' },
    });

    return NextResponse.json({
      success: true,
      message: 'Consegna completata con successo',
    });
  } catch (error) {
    console.error('Delivery error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
