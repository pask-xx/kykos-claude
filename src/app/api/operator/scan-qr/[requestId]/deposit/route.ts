import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { parseQrCodeData } from '@/lib/qrcode';

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getOperatorSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { requestId } = await params;

    const { depositLocation, notes } = await request.json();

    if (!depositLocation) {
      return NextResponse.json({ error: 'Posizione di deposito obbligatoria' }, { status: 400 });
    }

    // Find the request
    const req = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        object: {
          select: {
            id: true,
            title: true,
            status: true,
            donorId: true,
            donor: { select: { name: true } },
            intermediary: { select: { name: true } },
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
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

    // Check object is in correct status (should be RESERVED from initial approval)
    if (req.object.status !== 'RESERVED' && req.object.status !== 'WITHDRAWN') {
      return NextResponse.json({ error: 'Stato oggetto non valido per questa operazione' }, { status: 400 });
    }

    // Update object status to WITHDRAWN and save deposit location
    await prisma.object.update({
      where: { id: req.objectId },
      data: {
        status: 'WITHDRAWN',
        depositLocation: depositLocation,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Posizione deposito registrata!',
    });
  } catch (error) {
    console.error('Deposit location error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}