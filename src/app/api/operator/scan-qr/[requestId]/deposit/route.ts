import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { parseQrCodeData } from '@/lib/qrcode';
import { sendPickupQrNotification } from '@/lib/email';
import { generatePickupQrCode, generateAndUploadQrCodeWithLogo, generateDeliverQrCode } from '@/lib/qrcode';
import { NotificationType, RecipientType } from '@prisma/client';

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
            donor: { select: { nickname: true, name: true } },
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
                printLabel: true,
                labelSize: true,
              },
            },
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            nickname: true,
            email: true,
            isStreetManaged: true,
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
    if (req.object.status !== 'RESERVED' && req.object.status !== 'DEPOSITED') {
      return NextResponse.json({ error: 'Stato oggetto non valido per questa operazione' }, { status: 400 });
    }

    // Update object status to DEPOSITED and save deposit location
    await prisma.object.update({
      where: { id: req.objectId },
      data: {
        status: 'DEPOSITED',
        depositLocation: depositLocation,
        depositNotes: notes || null,
      },
    });

    // Generate pickup QR for recipient notification
    const pickupQrData = generatePickupQrCode(requestId, req.recipientId, 'object');
    const pickupQrImage = await generateAndUploadQrCodeWithLogo(pickupQrData, 'pickup-' + requestId + '.png');

    // Generate DELIVER QR for object label (for pickup verification)
    const deliverQrData = generateDeliverQrCode(requestId, req.object.donorId, 'object');

    // For street-managed beneficiaries, notify street operators instead of sending email
    if (req.recipient.isStreetManaged) {
      // Find all street operators assigned to this beneficiary
      const streetOperatorAssignments = await prisma.streetOperatorBeneficiary.findMany({
        where: { beneficiaryId: req.recipient.id },
        include: {
          streetOperator: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      // Create notifications for each street operator
      for (const assignment of streetOperatorAssignments) {
        await prisma.notification.create({
          data: {
            recipientOperatorId: assignment.streetOperator.id,
            recipientType: RecipientType.OPERATOR,
            title: 'Oggetto depositato per beneficiario street',
            message: 'Deposito effettuato per ' + req.recipient.name + ': "' + req.object.title + '". Consegna da effettuare.',
            type: NotificationType.STREET_OBJECT_DEPOSITED,
            link: '/operator/street-beneficiaries/' + req.recipient.id,
            data: JSON.stringify({
              objectId: req.objectId,
              requestId: requestId,
              beneficiaryId: req.recipient.id,
              depositLocation,
            }),
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Posizione deposito registrata! Notificati ' + streetOperatorAssignments.length + ' operatore(i) di strada per ' + req.recipient.name + '.',
        showLabelDialog: false, // Street beneficiaries don't print labels
        isStreetBeneficiary: true,
      });
    }

    // Standard flow: send pickup QR email to regular beneficiary
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
      message: req.object.intermediary.printLabel
        ? 'Posizione deposito registrata! Il beneficiario ha ricevuto il QR code per il ritiro.'
        : 'Posizione deposito registrata! Il beneficiario ha ricevuto il QR code per il ritiro.',
      showLabelDialog: req.object.intermediary.printLabel,
      labelData: req.object.intermediary.printLabel ? {
        requestId: req.id,
        recipientName: req.recipient.name,
        itemDescription: req.object.title,
        depositDate: new Date().toISOString().split('T')[0],
        qrData: deliverQrData,
        labelSize: req.object.intermediary.labelSize,
      } : null,
    });
  } catch (error) {
    console.error('Deposit location error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}