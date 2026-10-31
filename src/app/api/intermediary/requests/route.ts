import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendDeliveryQrNotification, sendDonationConfirmedNotification } from '@/lib/email';
import { generateAndUploadQrCodeWithLogo, generateDeliverQrCode, generatePickupQrCode } from '@/lib/qrcode';
import { isEntityPublished, OBJECT_STATUS_ON_APPROVAL, sendEntityPickupQrNotification } from '@/lib/entity-objects';
import { withErrorHandler } from '@/lib/api';
import type { LocationHours } from '@/types';

export const GET = withErrorHandler(async () => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  if (session.role !== 'INTERMEDIARY') {
    return NextResponse.json({ error: 'Solo intermediari' }, { status: 403 });
  }

  const org = await prisma.organization.findUnique({
    where: { userId: session.id },
  });

  if (!org) {
    return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
  }

  const requests = await prisma.request.findMany({
    where: { intermediaryId: org.id },
    include: {
      object: {
        select: {
          title: true,
          imageUrls: true,
          donor: { select: { nickname: true, name: true } },
        },
      },
      recipient: { select: { nickname: true, name: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ requests });
}, 'GET /api/intermediary/requests');

export const PATCH = withErrorHandler(async (request: Request) => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  if (session.role !== 'INTERMEDIARY') {
    return NextResponse.json({ error: 'Solo intermediari' }, { status: 403 });
  }

  const { requestId, action } = await request.json();

  if (!requestId || !action) {
    return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({
    where: { userId: session.id },
    select: { id: true, name: true, address: true, houseNumber: true, cap: true, city: true, province: true, phone: true, email: true, hoursInfo: true, hours: true, notes: true },
  });

  if (!org) {
    return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
  }

  // Verify request belongs to this intermediary
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

  if (req.intermediaryId !== org.id) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  if (action === 'approve') {
    // Disponibilità pubblicata dall'ente (l'ente è il donatore): non esiste
    // un donatore da avvisare e l'oggetto è già in giacenza in sede.
    const isEntityObject = isEntityPublished(req.object);
    const objectStatusOnApproval = isEntityObject
      ? OBJECT_STATUS_ON_APPROVAL.ENTITY
      : OBJECT_STATUS_ON_APPROVAL.DONOR;

    // Generate QR codes.
    // - QR di consegna: solo per i donatori utente (l'ente non consegna).
    // - QR di ritiro: nel flusso donatore viene inviato al beneficiario solo
    //   dopo la consegna (scan del QR di consegna); nel flusso ente viene
    //   inviato subito al beneficiario.
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

    // Approve and create donation
    await prisma.$transaction(async (tx) => {
      // Update request status
      await tx.request.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      });

      // Update object status
      await tx.object.update({
        where: { id: req.objectId },
        data: { status: objectStatusOnApproval },
      });

      // Create donation record
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
          name: org.name,
          address: org.address ?? null,
          houseNumber: org.houseNumber ?? null,
          cap: org.cap ?? null,
          city: org.city ?? null,
          province: org.province ?? null,
          phone: org.phone ?? null,
          email: org.email ?? null,
          hoursInfo: org.hoursInfo ?? null,
          hours: (org.hours as unknown as LocationHours | null) ?? null,
          notes: org.notes ?? null,
        },
      });
    } else {
      // Send Delivery QR to DONOR only (donor must deliver first)
      if (deliverQrData && deliverQrImage) {
        await sendDeliveryQrNotification(
          req.object.donor.email,
          req.object.donorId,
          req.object.donor.name,
          req.object.title,
          deliverQrData,
          deliverQrImage,
          org.name,
          org.address || null,
          org.houseNumber || null,
          org.cap || null,
          org.city || null,
          org.province || null,
          org.phone || null,
          org.email || null,
          org.hoursInfo || null
        );
      }

      // NOTE: Pickup QR email to beneficiary will be sent AFTER donor delivers (when operator scans deliver QR)
      // We no longer send pickup QR immediately - that happens in scan-qr endpoint

      // Notify donor of completed donation
      await sendDonationConfirmedNotification(
        req.object.donor.email,
        req.object.donorId,
        req.object.donor.name,
        req.object.title
      );
    }

    return NextResponse.json({ success: true, message: 'Richiesta approvata' });
  } else if (action === 'reject') {
    await prisma.request.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    return NextResponse.json({ success: true, message: 'Richiesta rifiutata' });
  }

  return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
}, 'PATCH /api/intermediary/requests');
