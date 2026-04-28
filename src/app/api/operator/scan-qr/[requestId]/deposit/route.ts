import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { parseQrCodeData } from '@/lib/qrcode';
import { sendPickupQrNotification } from '@/lib/email';
import { generatePickupQrCode, generateAndUploadQrCode } from '@/lib/qrcode';

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

    // Find the request with all needed data
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
            intermediary: {
              select: {
                name: true,
                address: true,
                houseNumber: true,
                cap: true,
                city: true,
                province: true,
                phone: true,
                email: true,
                hoursInfo: true,
              },
            },
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

    // Check object is in correct status
    if (req.object.status !== 'RESERVED' && req.object.status !== 'WITHDRAWN') {
      return NextResponse.json({ error: 'Stato oggetto non valido per questa operazione' }, { status: 400 });
    }

    // Update object status to WITHDRAWN and save deposit location
    await prisma.object.update({
      where: { id: req.objectId },
      data: {
        status: 'WITHDRAWN',
        depositLocation: depositLocation,
        depositNotes: notes || null,
      },
    });

    // Generate pickup QR and send to beneficiary
    const pickupQrData = generatePickupQrCode(requestId, req.recipientId);
    const pickupQrImage = await generateAndUploadQrCode(pickupQrData, `pickup-${requestId}.png`);

    await sendPickupQrNotification(
      req.recipient.email,
      req.recipientId,
      req.recipient.name,
      req.object.title,
      req.objectId,
      pickupQrData,
      pickupQrImage,
      req.object.intermediary.name,
      req.object.intermediary.address || null,
      req.object.intermediary.houseNumber || null,
      req.object.intermediary.cap || null,
      req.object.intermediary.city || null,
      req.object.intermediary.province || null,
      req.object.intermediary.phone || null,
      req.object.intermediary.email || null,
      req.object.intermediary.hoursInfo
    );

    return NextResponse.json({
      success: true,
      message: 'Posizione deposito registrata! Il beneficiario ha ricevuto il QR code per il ritiro.',
    });
  } catch (error) {
    console.error('Deposit location error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}