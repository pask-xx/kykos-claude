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

    const availabilities = await prisma.multiAvailability.findMany({
      where: { organizationId: session.organizationId },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        availableQty: true,
        assignedQty: true,
        status: true,
        deadline: true,
        createdAt: true,
        _count: {
          select: {
            requests: { where: { status: 'PENDING' } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ availabilities });
  } catch (error) {
    console.error('MultiAvailability list error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
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

    const body = await request.json();
    const { title, description, category, availableQty, deadline, exhaustMessage } = body;

    if (!title || !category || availableQty === undefined) {
      return NextResponse.json({ error: 'title, category e availableQty sono obbligatori' }, { status: 400 });
    }

    if (availableQty < 1) {
      return NextResponse.json({ error: 'availableQty deve essere almeno 1' }, { status: 400 });
    }

    const availability = await prisma.multiAvailability.create({
      data: {
        title,
        description,
        category,
        availableQty,
        deadline: deadline ? new Date(deadline) : null,
        exhaustMessage: exhaustMessage || 'Spiacenti, le scorte sono esaurite. Non è stato possibile soddisfare la tua richiesta.',
        organizationId: session.organizationId,
      },
    });

    return NextResponse.json({ availability }, { status: 201 });
  } catch (error) {
    console.error('MultiAvailability create error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}