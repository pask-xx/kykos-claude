import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'DONOR') {
      return NextResponse.json({ error: 'Solo donatori' }, { status: 403 });
    }

    const { id: objectId } = await params;

    const object = await prisma.object.findFirst({
      where: {
        id: objectId,
        donorId: session.id,
      },
      include: {
        requests: {
          include: {
            recipient: {
              select: { name: true },
            },
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
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'DONOR') {
      return NextResponse.json({ error: 'Solo donatori' }, { status: 403 });
    }

    const { id: objectId } = await params;

    const object = await prisma.object.findFirst({
      where: {
        id: objectId,
        donorId: session.id,
        status: 'AVAILABLE',
      },
    });

    if (!object) {
      return NextResponse.json({ error: 'Oggetto non trovato o non cancellabile' }, { status: 404 });
    }

    await prisma.object.update({
      where: { id: objectId },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting object:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}