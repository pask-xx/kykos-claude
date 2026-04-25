import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { parseQrCodeData } from '@/lib/qrcode';
import { sendObjectReadyForPickupNotification } from '@/lib/email';
import { hasPermission } from '@/lib/permissions';

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

    const operator = await prisma.operator.findUnique({
      where: { id: session.operatorId },
    });

    if (!operator || !operator.active) {
      return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
    }

    // Check permission - need OBJECT_DELIVER for scanning pickup QR codes
    if (!hasPermission(operator.role, operator.permissions, 'OBJECT_DELIVER')) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const { qrData } = await request.json();

    if (!qrData) {
      return NextResponse.json({ error: 'QR data mancante' }, { status: 400 });
    }

    // Parse QR code data
    const parsed = parseQrCodeData(qrData);
    if (!parsed) {
      return NextResponse.json({ error: 'QR code non valido' }, { status: 400 });
    }

    const { requestId, recipientId } = parsed;

    // Find the request and verify it belongs to this organization
    const req = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        object: {
          select: {
            id: true,
            title: true,
            status: true,
            donorId: true,
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

    if (req.recipientId !== recipientId) {
      return NextResponse.json({ error: 'QR code non valido per questo destinatario' }, { status: 400 });
    }

    if (req.object.status !== 'RESERVED') {
      return NextResponse.json({ error: 'Oggetto non disponibile per il ritiro' }, { status: 400 });
    }

    // Update object status to WITHDRAWN
    await prisma.object.update({
      where: { id: req.objectId },
      data: { status: 'WITHDRAWN' },
    });

    // Notify recipient that object is ready for pickup
    await sendObjectReadyForPickupNotification(
      req.recipient.email,
      req.recipient.name,
      req.object.title,
      req.object.id
    );

    return NextResponse.json({
      success: true,
      message: 'Oggetto marcato come ritirato. Destinatario notificato.',
      data: {
        objectTitle: req.object.title,
        recipientName: req.recipient.name,
      },
    });
  } catch (error) {
    console.error('QR scan error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
