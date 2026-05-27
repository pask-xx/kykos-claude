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

    const causes = await prisma.cause.findMany({
      where: { organizationId: session.organizationId },
      include: {
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      causes: causes.map((c) => ({
        ...c,
        participantCount: c._count.participants,
      })),
    });
  } catch (error) {
    console.error('Causes list error:', error);
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
    const { title, description, targetQty, deadline, imageUrls } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Titolo obbligatorio' }, { status: 400 });
    }

    const cause = await prisma.cause.create({
      data: {
        title: title.trim(),
        description: description?.trim() || '',
        targetQty: targetQty || null,
        deadline: deadline ? new Date(deadline) : null,
        imageUrls: imageUrls || [],
        organizationId: session.organizationId,
      },
    });

    return NextResponse.json({ cause });
  } catch (error) {
    console.error('Cause create error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
