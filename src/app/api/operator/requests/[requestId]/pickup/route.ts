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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getOperatorSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { requestId } = await params;

    const req = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        object: {
          select: {
            id: true,
            title: true,
            depositLocation: true,
            status: true,
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

    return NextResponse.json({
      title: req.object.title,
      depositLocation: req.object.depositLocation,
      objectId: req.object.id,
      recipientName: req.recipient.name,
      objectStatus: req.object.status,
    });
  } catch (error) {
    console.error('Pickup info error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}