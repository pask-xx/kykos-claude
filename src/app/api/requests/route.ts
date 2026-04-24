import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendRequestNotification } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'RECIPIENT') {
      return NextResponse.json({ error: 'Solo i riceventi possono fare richieste' }, { status: 403 });
    }

    // Check if recipient is authorized
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { authorized: true },
    });

    if (!user?.authorized) {
      return NextResponse.json({ error: 'Devi essere autorizzato per poter richiedere oggetti' }, { status: 403 });
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
      include: {
        object: {
          include: {
            donor: { select: { name: true, email: true } },
          },
        },
      },
    });

    // Notify donor via email
    const donorEmail = req.object.donor.email;
    const donorName = req.object.donor.name;
    await sendRequestNotification(donorEmail, donorName, object.title, object.id);

    return NextResponse.json({ request: req });
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'RECIPIENT') {
      return NextResponse.json({ error: 'Solo i riceventi possono annullare richieste' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');

    if (!requestId) {
      return NextResponse.json({ error: 'ID richiesta mancante' }, { status: 400 });
    }

    // Find the request
    const req = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!req) {
      return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
    }

    // Check ownership
    if (req.recipientId !== session.id) {
      return NextResponse.json({ error: 'Non puoi annullare questa richiesta' }, { status: 403 });
    }

    // Check status - can only cancel PENDING requests
    if (req.status !== 'PENDING') {
      return NextResponse.json({ error: 'Solo le richieste in attesa possono essere annullate' }, { status: 400 });
    }

    // Delete the request
    await prisma.request.delete({
      where: { id: requestId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error canceling request:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
