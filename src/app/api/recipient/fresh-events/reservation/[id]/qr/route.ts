// =============================================================
// GET /api/recipient/fresh-events/reservation/[id]/qr
// Ritorna il QR code (e immagine Supabase) per la prenotazione.
// Solo se status è CONFIRMED, ADMITTED o PICKED_UP.
// =============================================================

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api';
import { generateAndUploadQrCodeWithLogo } from '@/lib/qrcode';
import { makeFreshReservationQrCode } from '@/lib/fresh-events';

export const GET = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: reservationId } = await params;
  const session = await getSession();

  if (!session || session.role !== 'RECIPIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const reservation = await prisma.freshEventReservation.findUnique({
    where: { id: reservationId },
    select: {
      id: true,
      beneficiaryId: true,
      status: true,
      qrCode: true,
      freshEvent: {
        select: {
          id: true,
          scheduledStart: true,
          scheduledEnd: true,
          pickupInstructions: true,
          template: {
            select: { id: true, title: true },
          },
        },
      },
    },
  });

  if (!reservation || reservation.beneficiaryId !== session.id) {
    return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
  }

  if (
    reservation.status !== 'CONFIRMED' &&
    reservation.status !== 'ADMITTED' &&
    reservation.status !== 'PICKED_UP'
  ) {
    return NextResponse.json(
      { error: 'QR non disponibile per questa prenotazione' },
      { status: 400 },
    );
  }

  // Genera QR code immagine (idempotente: riusa il qrCode testuale già salvato)
  const qrCodeData = reservation.qrCode ?? makeFreshReservationQrCode(reservation.id, session.id);
  let qrCodeImageUrl: string | null = null;
  try {
    qrCodeImageUrl = await generateAndUploadQrCodeWithLogo(qrCodeData, `fresh-${reservation.id}.png`);
  } catch (err) {
    console.error(`[fresh-events/qr] QR generation failed for ${reservation.id}:`, err);
  }

  return NextResponse.json({
    success: true,
    reservationId: reservation.id,
    qrCode: qrCodeData,
    qrCodeImageUrl,
    event: reservation.freshEvent,
  });
}, 'GET /api/recipient/fresh-events/reservation/[id]/qr');
