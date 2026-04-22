import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const object = await prisma.object.findUnique({
      where: { id },
      include: {
        donor: {
          select: {
            name: true,
            latitude: true,
            longitude: true,
          },
        },
        intermediary: {
          select: {
            name: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (!object) {
      return NextResponse.json({ error: 'Oggetto non trovato' }, { status: 404 });
    }

    return NextResponse.json({ object });
  } catch (error) {
    console.error('Error fetching object:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
