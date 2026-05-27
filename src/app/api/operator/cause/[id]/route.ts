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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const cause = await prisma.cause.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    if (!cause) {
      return NextResponse.json({ error: 'Causa non trovata' }, { status: 404 });
    }

    if (cause.organizationId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    return NextResponse.json({ cause });
  } catch (error) {
    console.error('Cause detail error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const cause = await prisma.cause.findUnique({ where: { id } });
    if (!cause) {
      return NextResponse.json({ error: 'Causa non trovata' }, { status: 404 });
    }

    if (cause.organizationId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, targetQty, deadline, imageUrls } = body;

    const updated = await prisma.cause.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(targetQty !== undefined && { targetQty }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(imageUrls !== undefined && { imageUrls }),
      },
    });

    return NextResponse.json({ cause: updated });
  } catch (error) {
    console.error('Cause update error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const cause = await prisma.cause.findUnique({
      where: { id },
      include: { _count: { select: { participants: true } } },
    });
    if (!cause) {
      return NextResponse.json({ error: 'Causa non trovata' }, { status: 404 });
    }

    if (cause.organizationId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    if (cause._count.participants > 0) {
      return NextResponse.json(
        { error: 'Impossibile eliminare: ci sono partecipanti' },
        { status: 400 }
      );
    }

    await prisma.cause.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cause delete error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
