import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { generateDeliverQrCode, generatePickupQrCode, generateAndUploadQrCodeWithLogo } from '@/lib/qrcode';
import { sendDeliveryQrNotification } from '@/lib/email';
import { getJwtSecret } from '@/lib/auth';

const JWT_SECRET = getJwtSecret();

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

// POST /api/operator/request-object - crea richiesta per un beneficiario
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

    if (!operator.isStreetOperator && !operator.isOfficeOperator) {
      return NextResponse.json({ error: 'Non è un operatore abilitato' }, { status: 403 });
    }

    const { objectId, recipientId, message } = await request.json();

    if (!objectId || !recipientId) {
      return NextResponse.json({ error: 'objectId e recipientId sono obbligatori' }, { status: 400 });
    }

    // Get object and verify it's AVAILABLE
    const object = await prisma.object.findUnique({
      where: { id: objectId },
    });

    if (!object) {
      return NextResponse.json({ error: 'Oggetto non trovato' }, { status: 404 });
    }

    if (object.status !== 'AVAILABLE') {
      return NextResponse.json({ error: 'L\'oggetto non è più disponibile' }, { status: 400 });
    }

    // Get recipient
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Beneficiario non trovato' }, { status: 404 });
    }

    if (recipient.role !== 'RECIPIENT') {
      return NextResponse.json({ error: 'L\'utente non è un beneficiario' }, { status: 400 });
    }

    if (!recipient.authorized) {
      return NextResponse.json({ error: 'Il beneficiario non è autorizzato' }, { status: 400 });
    }

    // Get the intermediary organization for this object (where it was deposited)
    const objectOrg = await prisma.organization.findUnique({
      where: { id: object.intermediaryId },
    });

    if (!objectOrg) {
      return NextResponse.json({ error: 'Ente dell\'oggetto non trovato' }, { status: 404 });
    }

    // Check that the object organization is in the same diocese as the operator's organization
    const operatorOrg = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      select: { dioceseId: true },
    });

    if (!operatorOrg?.dioceseId || operatorOrg.dioceseId !== objectOrg.dioceseId) {
      return NextResponse.json({ error: 'L\'oggetto non è nella tua diocesi' }, { status: 403 });
    }

    // Check if there's already a pending/approved request for this object and recipient
    const existingRequest = await prisma.request.findFirst({
      where: {
        objectId,
        recipientId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'Esiste già una richiesta per questo oggetto e beneficiario' }, { status: 400 });
    }

    // Create the request - auto-approved since street operator is a delegate of the entity
    const newRequest = await prisma.request.create({
      data: {
        objectId,
        recipientId,
        intermediaryId: object.intermediaryId, // Use the object's intermediary
        status: 'APPROVED', // Auto-approved as the operator is a delegate
        message: message || null,
      },
    });

    // Update object status to RESERVED and create donation with QR codes
    await prisma.object.update({
      where: { id: objectId },
      data: { status: 'RESERVED' },
    });

    // Get full data for email and QR codes
    const fullRequest = await prisma.request.findUnique({
      where: { id: newRequest.id },
      include: {
        object: {
          include: {
            donor: { select: { id: true, nickname: true, name: true, email: true } },
          },
        },
        recipient: { select: { id: true, nickname: true, name: true, email: true } },
      },
    });

    // Get organization details
    const org = await prisma.organization.findUnique({
      where: { id: object.intermediaryId },
      select: { name: true, address: true, houseNumber: true, cap: true, city: true, province: true, phone: true, email: true, hoursInfo: true },
    });

    // Generate QR codes
    const deliverQrData = generateDeliverQrCode(newRequest.id, fullRequest!.object.donorId, 'object');
    const pickupQrData = generatePickupQrCode(newRequest.id, fullRequest!.recipientId, 'object');
    const deliverQrImage = await generateAndUploadQrCodeWithLogo(deliverQrData, `deliver-${newRequest.id}.png`);
    const pickupQrImage = await generateAndUploadQrCodeWithLogo(pickupQrData, `pickup-${newRequest.id}.png`);

    // Create donation record
    await prisma.donation.create({
      data: {
        objectId: objectId,
        donorId: fullRequest!.object.donorId,
        recipientId: recipientId,
        requestId: newRequest.id,
        amount: 1.00,
        currency: 'EUR',
      },
    });

    // Send email to donor with QR code
    await sendDeliveryQrNotification(
      fullRequest!.object.donor.email,
      fullRequest!.object.donorId,
      fullRequest!.object.donor.name,
      fullRequest!.object.title,
      deliverQrData,
      deliverQrImage,
      org?.name || '',
      org?.address || null,
      org?.houseNumber || null,
      org?.cap || null,
      org?.city || null,
      org?.province || null,
      org?.phone || null,
      org?.email || null,
      org?.hoursInfo || null
    );

    return NextResponse.json({
      success: true,
      request: {
        id: newRequest.id,
        status: newRequest.status,
        objectId: newRequest.objectId,
        recipientId: newRequest.recipientId,
      },
    });
  } catch (error) {
    console.error('Create request error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
