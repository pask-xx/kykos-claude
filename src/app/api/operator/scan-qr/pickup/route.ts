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

export async function POST(request: Request) {
  try {
    const session = await getOperatorSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID mancante' }, { status: 400 });
    }

    const req = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        object: {
          select: {
            id: true,
            title: true,
            status: true,
            depositLocation: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!req) {
      return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
    }

    if (req.intermediaryId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Check object status - should be WITHDRAWN at entity
    if (req.object.status !== 'WITHDRAWN') {
      return NextResponse.json({ error: 'Stato oggetto non valido per il ritiro' }, { status: 400 });
    }

    // Mark as DONATED (final delivery)
    await prisma.object.update({
      where: { id: req.objectId },
      data: { status: 'DONATED' },
    });

    return NextResponse.json({
      success: true,
      message: 'Ritiro completato!',
    });
  } catch (error) {
    console.error('Pickup complete error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}