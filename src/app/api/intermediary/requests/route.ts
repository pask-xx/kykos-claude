import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendDeliveryQrNotification, sendDonationConfirmedNotification } from '@/lib/email';
import { generateAndUploadQrCodeWithLogo, generateDeliverQrCode, generatePickupQrCode } from '@/lib/qrcode';
import { withErrorHandler } from '@/lib/api';

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
    select: { id: true, name: true, address: true, houseNumber: true, cap: true, city: true, province: true, phone: true, email: true, hoursInfo: true },
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
    // Generate both QR codes
    const deliverQrData = generateDeliverQrCode(requestId, req.object.donorId, 'object');
    const pickupQrData = generatePickupQrCode(requestId, req.recipientId, 'object');
    const deliverQrImage = await generateAndUploadQrCodeWithLogo(deliverQrData, `deliver-${requestId}.png`);
    const pickupQrImage = await generateAndUploadQrCodeWithLogo(pickupQrData, `pickup-${requestId}.png`);

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
        data: { status: 'RESERVED' },
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

    // Send Delivery QR to DONOR only (donor must deliver first)
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

    // NOTE: Pickup QR email to beneficiary will be sent AFTER donor delivers (when operator scans deliver QR)
    // We no longer send pickup QR immediately - that happens in scan-qr endpoint

    // Notify donor of completed donation
    await sendDonationConfirmedNotification(
      req.object.donor.email,
      req.object.donorId,
      req.object.donor.name,
      req.object.title
    );

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
