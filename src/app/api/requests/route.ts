import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendRequestNotification, sendDeliveryQrNotification } from '@/lib/email';
import { generateAndUploadQrCodeWithLogo, generateDeliverQrCode } from '@/lib/qrcode';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'RECIPIENT') {
      return NextResponse.json({ error: 'Solo i riceventi possono fare richieste' }, { status: 403 });
    }

    // Check if recipient is authorized
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { authorized: true },
    });

    if (!user?.authorized) {
      return NextResponse.json({ error: 'Devi essere autorizzato per poter richiedere oggetti' }, { status: 403 });
    }

    const { objectId, message } = await request.json();

    if (!objectId) {
      return NextResponse.json({ error: 'ID oggetto mancante' }, { status: 400 });
    }

    // Pre-fetch read-only: verify object state BEFORE entering the transaction
    // (these are idempotent reads, no race risk)
    const object = await prisma.object.findUnique({
      where: { id: objectId },
      include: { intermediary: true },
    });

    if (!object) {
      return NextResponse.json({ error: 'Oggetto non trovato' }, { status: 404 });
    }

    if (object.status !== 'AVAILABLE') {
      return NextResponse.json({ error: 'Oggetto non più disponibile' }, { status: 400 });
    }

    // Check if already requested (idempotent: same recipient can never get two requests for the same object)
    const existingRequest = await prisma.request.findFirst({
      where: { objectId, recipientId: session.id },
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'Hai già richiesto questo oggetto' }, { status: 400 });
    }

    // Create request - check if intermediary auto-approves
    const shouldAutoApprove = object.intermediary.autoApproveRequests;

    // B3 — Race-safe reservation.
    // We move the entire mutation (request + donation + object -> RESERVED) inside a transaction.
    // The atomic primitive is `object.updateMany` with a conditional WHERE on `status: 'AVAILABLE'`.
    // If two recipients race, only one updateMany succeeds (count=1); the other sees count=0
    // and gets a clear 409 — no orphan donations, no double QR codes sent to the donor.
    const req = await prisma.$transaction(async (tx) => {
      if (shouldAutoApprove) {
        // Atomic reservation: succeed only if object is still AVAILABLE
        const reserved = await tx.object.updateMany({
          where: { id: objectId, status: 'AVAILABLE' },
          data: { status: 'RESERVED' },
        });

        if (reserved.count === 0) {
          // Race lost: another recipient reserved this object between our pre-check
          // and now. Throw inside tx to roll back any partial state.
          throw new Error('RACE_LOST_OBJECT_RESERVED');
        }
      }

      // Create the request first (also in the tx, so the donation.requestId is consistent)
      const created = await tx.request.create({
        data: {
          objectId,
          recipientId: session.id,
          intermediaryId: object.intermediaryId,
          message,
          status: shouldAutoApprove ? 'APPROVED' : 'PENDING',
        },
        include: {
          object: {
            include: {
              donor: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      // If auto-approved, create the donation record in the same tx.
      // The `requestId @unique` constraint means we need the request to exist first —
      // if donation.create fails (e.g. duplicate objectId from a re-raced race), the
      // entire tx rolls back, including the object status update.
      if (shouldAutoApprove) {
        await tx.donation.create({
          data: {
            objectId,
            donorId: object.donorId,
            recipientId: session.id,
            requestId: created.id,
            amount: 1.00,
            currency: 'EUR',
          },
        });
      }

      return created;
    });

    // Side effects OUTSIDE the transaction (best-effort, never rolls back DB state)
    if (shouldAutoApprove) {
      // Generate and send delivery QR code to donor
      try {
        const qrData = generateDeliverQrCode(req.id, req.object.donorId, 'object');
        const qrImageUrl = await generateAndUploadQrCodeWithLogo(qrData, `object-deliver-${req.id}.png`);

        await sendDeliveryQrNotification(
          req.object.donor.email,
          req.object.donorId,
          req.object.donor.name,
          object.title,
          qrData,
          qrImageUrl,
          object.intermediary.name,
          object.intermediary.address,
          object.intermediary.houseNumber,
          object.intermediary.cap,
          object.intermediary.city,
          object.intermediary.province,
          object.intermediary.phone,
          object.intermediary.email,
          object.intermediary.hoursInfo
        );
      } catch (qrError) {
        console.error('Error generating/sending delivery QR:', qrError);
      }
    } else {
      // Notify donor via email (PENDING path)
      await sendRequestNotification(
        req.object.donor.email,
        req.object.donorId,
        req.object.donor.name,
        object.title,
        object.id
      );
    }

    return NextResponse.json({ request: req, autoApproved: shouldAutoApprove });
  } catch (error) {
    // B3: surface a 409 (not a 500) when the race is lost, so the client
    // can show a clear "qualcun altro l'ha appena preso" message.
    if (error instanceof Error && error.message === 'RACE_LOST_OBJECT_RESERVED') {
      return NextResponse.json(
        { error: 'Oggetto appena riservato da un altro ricevente' },
        { status: 409 }
      );
    }
    console.error('Error creating request:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'RECIPIENT') {
      return NextResponse.json({ error: 'Solo i riceventi possono annullare richieste' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');

    if (!requestId) {
      return NextResponse.json({ error: 'ID richiesta mancante' }, { status: 400 });
    }

    // Find the request
    const req = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!req) {
      return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
    }

    // Check ownership
    if (req.recipientId !== session.id) {
      return NextResponse.json({ error: 'Non puoi annullare questa richiesta' }, { status: 403 });
    }

    // Check status - can only cancel PENDING requests
    if (req.status !== 'PENDING') {
      return NextResponse.json({ error: 'Solo le richieste in attesa possono essere annullate' }, { status: 400 });
    }

    // Delete the request
    await prisma.request.delete({
      where: { id: requestId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error canceling request:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
