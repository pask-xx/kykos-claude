import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id: multiAvailabilityId } = await params;

    // Get user's needScore for the snapshot
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { needScore: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    // Check if multi-availability exists and is open
    const multiAvailability = await prisma.multiAvailability.findUnique({
      where: { id: multiAvailabilityId },
      select: { status: true, availableQty: true, assignedQty: true }
    });

    if (!multiAvailability) {
      return NextResponse.json({ error: 'Disponibilità non trovata' }, { status: 404 });
    }

    if (multiAvailability.status !== 'OPEN') {
      return NextResponse.json({ error: 'Disponibilità non più aperta' }, { status: 400 });
    }

    // Check if already requested
    const existingRequest = await prisma.multiAvailabilityRequest.findUnique({
      where: {
        multiAvailabilityId_beneficiaryId: {
          multiAvailabilityId,
          beneficiaryId: session.id,
        }
      }
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'Richiesta già effettuata' }, { status: 400 });
    }

    // Create the request
    const newRequest = await prisma.multiAvailabilityRequest.create({
      data: {
        multiAvailabilityId,
        beneficiaryId: session.id,
        needScoreSnapshot: user.needScore,
        status: 'PENDING',
      }
    });

    return NextResponse.json({ request: newRequest }, { status: 201 });
  } catch (error) {
    console.error('Multi availability request error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}