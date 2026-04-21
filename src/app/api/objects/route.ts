import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: Record<string, unknown> = {
      status: 'AVAILABLE',
    };

    if (category && category !== 'ALL') {
      where.category = category;
    }

    const objects = await prisma.object.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        donor: {
          select: { name: true },
        },
        intermediary: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ objects });
  } catch (error) {
    console.error('Error fetching objects:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'DONOR') {
      return NextResponse.json({ error: 'Solo i donatori possono pubblicare oggetti' }, { status: 403 });
    }

    const { title, description, category, condition, imageUrl, intermediaryId } = await request.json();

    if (!title || !category || !condition || !intermediaryId) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 });
    }

    const object = await prisma.object.create({
      data: {
        title,
        description,
        category,
        condition,
        imageUrl,
        donorId: session.id,
        intermediaryId,
        status: 'AVAILABLE',
      },
    });

    // Update donor profile
    await prisma.donorProfile.upsert({
      where: { userId: session.id },
      update: {
        totalObjects: { increment: 1 },
      },
      create: {
        userId: session.id,
        totalObjects: 1,
        level: 'BRONZE',
      },
    });

    return NextResponse.json({ object });
  } catch (error) {
    console.error('Error creating object:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Errore interno del server', details: message },
      { status: 500 }
    );
  }
}
