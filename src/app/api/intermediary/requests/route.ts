import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendQrCodeNotification, sendDonationConfirmedNotification } from '@/lib/email';
import { generateQrCodeDataUrl } from '@/lib/qrcode';

export async function GET() {
  try {
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
            donor: { select: { name: true } },
          },
        },
        recipient: { select: { name: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
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
            donor: { select: { name: true, email: true } },
          },
        },
        recipient: { select: { name: true, email: true } },
      },
    });

    if (!req) {
      return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
    }

    if (req.intermediaryId !== org.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    if (action === 'approve') {
      // Generate QR code data
      const qrCodeData = `kykos:pickup:${requestId}:${req.recipientId}`;
      const qrCodeImageUrl = await generateQrCodeDataUrl(qrCodeData);

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

      // Send QR code notification to DONATORE (donor)
      await sendQrCodeNotification(
        req.object.donor.email,
        req.object.donor.name,
        req.object.title,
        qrCodeData,
        qrCodeImageUrl
      );

      // Notify donor of completed donation
      await sendDonationConfirmedNotification(
        req.object.donor.email,
        req.object.donor.name,
        req.recipient.name,
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
  } catch (error) {
    console.error('Error updating request:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
