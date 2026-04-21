import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'RECIPIENT') {
      return NextResponse.json({ error: 'Solo i riceventi possono fare richieste' }, { status: 403 });
    }

    const { objectId, message } = await request.json();

    if (!objectId) {
      return NextResponse.json({ error: 'ID oggetto mancante' }, { status: 400 });
    }

    // Check if object exists and is available
    const object = await prisma.object.findUnique({
      where: { id: objectId },
      include: { intermediary: true },
    });

    if (!object) {
      return NextResponse.json({ error: 'Oggetto non trovato' }, { status: 404 });
    }

    if (object.status !== 'AVAILABLE') {
      return NextResponse.json({ error: 'Oggetto non più disponibile' }, { status: 400 });
    }

    // Check if already requested
    const existingRequest = await prisma.request.findFirst({
      where: { objectId, recipientId: session.id },
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'Hai già richiesto questo oggetto' }, { status: 400 });
    }

    // Create request
    const req = await prisma.request.create({
      data: {
        objectId,
        recipientId: session.id,
        intermediaryId: object.intermediaryId,
        message,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ request: req });
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
