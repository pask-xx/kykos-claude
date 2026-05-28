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

export async function GET() {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const now = new Date();

    // Cause attive: non scadute e con posti disponibili (se targetQty impostato)
    const causes = await prisma.cause.findMany({
      where: {
        OR: [
          { deadline: null },
          { deadline: { gt: now } },
        ],
      },
      include: {
        organization: {
          select: { id: true, name: true, city: true },
        },
        _count: {
          select: { participants: true },
        },
        participants: {
          where: { userId: session.userId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filtra per disponibilità (se targetQty impostato)
    const availableCauses = causes.filter((c) => {
      if (c.targetQty === null) return true;
      return c._count.participants < c.targetQty;
    });

    return NextResponse.json({
      causes: availableCauses.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        imageUrls: c.imageUrls,
        targetQty: c.targetQty,
        deadline: c.deadline,
        organization: c.organization,
        participantCount: c._count.participants,
        hasJoined: c.participants.length > 0,
      })),
    });
  } catch (error) {
    console.error('Causes list error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
