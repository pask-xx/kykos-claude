import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        latitude: true,
        longitude: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    return NextResponse.json({
      latitude: user.latitude,
      longitude: user.longitude,
    });
  } catch (error) {
    console.error('Error fetching user geo:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
