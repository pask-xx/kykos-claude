import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

async function getUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const user = (payload as { user?: { id: string; email: string; name: string; role: string } }).user;
    if (!user) return null;
    return { userId: user.id, role: user.role };
  } catch {
    return null;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const now = new Date();

    const cause = await prisma.cause.findUnique({
      where: { id },
      include: {
        _count: { select: { participants: true } },
      },
    });

    if (!cause) {
      return NextResponse.json({ error: 'Causa non trovata' }, { status: 404 });
    }

    // Verifica scadenza
    if (cause.deadline && cause.deadline <= now) {
      return NextResponse.json({ error: 'Causa scaduta' }, { status: 400 });
    }

    // Verifica disponibilità
    if (cause.targetQty !== null && cause._count.participants >= cause.targetQty) {
      return NextResponse.json({ error: 'Posti esauriti' }, { status: 400 });
    }

    // Verifica se già aderito
    const existing = await prisma.causeParticipant.findUnique({
      where: {
        causeId_userId: {
          causeId: id,
          userId: session.userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Già aderito' }, { status: 400 });
    }

    const participant = await prisma.causeParticipant.create({
      data: {
        causeId: id,
        userId: session.userId,
      },
    });

    return NextResponse.json({ participant });
  } catch (error) {
    console.error('Cause join error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
