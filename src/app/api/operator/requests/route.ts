import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hasPermission, hasAnyPermission } from '@/lib/permissions';
import { generateDeliverQrCode, generatePickupQrCode, generateAndUploadQrCodeWithLogo } from '@/lib/qrcode';
import { sendDeliveryQrNotification } from '@/lib/email';
import { isEntityPublished, OBJECT_STATUS_ON_APPROVAL, sendEntityPickupQrNotification } from '@/lib/entity-objects';
import { getJwtSecret } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';
import type { LocationHours } from '@/types';

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

export const GET = withErrorHandler(async () => {

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

  // Check permission
  if (!hasAnyPermission(operator.role, operator.permissions, ['RECIPIENT_AUTHORIZE', 'REQUEST_PROXY'])) {
    return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
  }

  const requests = await prisma.request.findMany({
    where: { intermediaryId: session.organizationId },
    include: {
      object: {
        select: {
          id: true,
          title: true,
          imageUrls: true,
          category: true,
          condition: true,
          status: true,
        },
      },
      recipient: {
        select: {
          id: true,
          nickname: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ requests });

}, 'GET /api/operator/requests');

export const PATCH = withErrorHandler(async (request: Request) => {

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

  // Check permission
  if (!hasAnyPermission(operator.role, operator.permissions, ['RECIPIENT_AUTHORIZE', 'REQUEST_PROXY'])) {
    return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
  }

  const { requestId, action } = await request.json();

  if (!requestId || !action) {
    return NextResponse.json({ error: 'requestId e action sono obbligatori' }, { status: 400 });
  }

  const requestData = await prisma.request.findUnique({
    where: { id: requestId },
  });

  if (!requestData) {
    return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
  }

  if (requestData.intermediaryId !== session.organizationId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  if (action === 'approve') {
    // Get full request data with donor and organization info
    const req = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        object: {
          include: {
            donor: { select: { id: true, nickname: true, name: true, email: true } },
          },
        },
        recipient: { select: { id: true, nickname: true, name: true, email: true } },
      },
    });

    if (!req) {
      return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
    }

    // Get organization details
    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      select: { name: true, address: true, houseNumber: true, cap: true, city: true, province: true, phone: true, email: true, hoursInfo: true, hours: true, notes: true },
    });

    // Disponibilità pubblicata dall'ente (l'ente è il donatore): non esiste
    // un donatore da avvisare e l'oggetto è già in giacenza in sede.
    const isEntityObject = isEntityPublished(req.object);
    const objectStatusOnApproval = isEntityObject
      ? OBJECT_STATUS_ON_APPROVAL.ENTITY
      : OBJECT_STATUS_ON_APPROVAL.DONOR;

    // Generate QR codes.
    // - QR di consegna: solo per i donatori utente (l'ente non consegna).
    // - QR di ritiro: generato nel flusso donatore (preparato qui, inviato al
    //   beneficiario dopo la consegna). Nel flusso ente lo genera
    //   sendEntityPickupQrNotification, che lo invia subito al beneficiario.
    const deliverQrData = isEntityObject
      ? null
      : generateDeliverQrCode(requestId, req.object.donorId, 'object');
    const deliverQrImage = deliverQrData
      ? await generateAndUploadQrCodeWithLogo(deliverQrData, `deliver-${requestId}.png`)
      : null;
    const pickupQrData = isEntityObject
      ? null
      : generatePickupQrCode(requestId, req.recipientId, 'object');
    const pickupQrImage = pickupQrData
      ? await generateAndUploadQrCodeWithLogo(pickupQrData, `pickup-${requestId}.png`)
      : null;

    // Update request, object and create donation in transaction
    await prisma.$transaction(async (tx) => {
      await tx.request.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      });

      await tx.object.update({
        where: { id: req.objectId },
        data: { status: objectStatusOnApproval },
      });

      await tx.donation.create({
        data: {
          objectId: req.objectId,
          donorId: req.object.donorId,
          recipientId: req.recipientId,
          requestId: req.id,
          amount: 1.00,
          currency: 'EUR',
        },
      });
    });

    if (isEntityObject) {
      // L'ente è il donatore: nessun QR di consegna, il beneficiario riceve
      // direttamente il QR di ritiro (il bene è già in giacenza presso l'ente).
      await sendEntityPickupQrNotification({
        requestId,
        recipientId: req.recipientId,
        recipientEmail: req.recipient.email,
        recipientName: req.recipient.name,
        objectTitle: req.object.title,
        objectId: req.objectId,
        org: {
          name: org?.name || '',
          address: org?.address ?? null,
          houseNumber: org?.houseNumber ?? null,
          cap: org?.cap ?? null,
          city: org?.city ?? null,
          province: org?.province ?? null,
          phone: org?.phone ?? null,
          email: org?.email ?? null,
          hoursInfo: org?.hoursInfo ?? null,
          hours: (org?.hours as unknown as LocationHours | null) ?? null,
          notes: org?.notes ?? null,
        },
      });
    } else if (deliverQrData && deliverQrImage) {
      // Send Delivery QR to donor
      await sendDeliveryQrNotification(
        req.object.donor.email,
        req.object.donorId,
        req.object.donor.name,
        req.object.title,
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
    }
  } else if (action === 'reject') {
    await prisma.request.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });
  } else {
    return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
  }

  return NextResponse.json({ success: true });

}, 'PATCH /api/operator/requests');
