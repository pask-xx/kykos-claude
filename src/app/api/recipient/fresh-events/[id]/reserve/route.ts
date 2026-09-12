// =============================================================
// POST /api/recipient/fresh-events/[id]/reserve
// Prenotazione slot: CONCORRENCY-SAFE.
// Se c'è posto (reservedCount < capacity) → CONFIRMED + QR generato.
// Altrimenti → WAITING + position in lista d'attesa.
//
// Pattern da /api/operator/multi-availability/[id]/assign:
// - prisma.$transaction con updateMany condizionato per capacità
// - QR + email + notifica FUORI dalla transazione (best-effort)
// =============================================================

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api';
import { generateAndUploadQrCodeWithLogo } from '@/lib/qrcode';
import {
  canReserveFreshSlot,
  getNextWaitingPosition,
  makeFreshReservationQrCode,
} from '@/lib/fresh-events';

export const POST = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: freshEventId } = await params;
  const session = await getSession();

  if (!session || session.role !== 'RECIPIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  // Pre-check: authorized, non sospeso, slot pubblicato
  const check = await canReserveFreshSlot(session.id, freshEventId);
  if (!check.ok) {
    return NextResponse.json(
      { error: check.message ?? 'Impossibile prenotare questo slot' },
      { status: check.reason === 'NOT_AUTHORIZED' || check.reason === 'SUSPENDED' ? 403 : 400 },
    );
  }

  // Recupera info evento e beneficiario per la transazione
  const [event, beneficiary] = await Promise.all([
    prisma.freshEvent.findUnique({
      where: { id: freshEventId },
      select: {
        id: true,
        capacity: true,
        reservedCount: true,
        status: true,
        scheduledStart: true,
        scheduledEnd: true,
        template: {
          select: {
            id: true,
            title: true,
            organizationId: true,
            organization: {
              select: { name: true, address: true, houseNumber: true, cap: true, city: true, province: true, phone: true, email: true, hoursInfo: true },
            },
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, firstName: true, lastName: true, nickname: true, name: true },
    }),
  ]);

  if (!event || !beneficiary) {
    return NextResponse.json({ error: 'Evento o utente non trovato' }, { status: 404 });
  }

  // --- Transazione atomica: capacità + creazione prenotazione ------------
  // Il pattern: increment condizionato di reservedCount (atomic UPDATE) +
  // verifica post-update che il beneficiario sia nei posti riservati.
  // Se non c'è capacità, creiamo direttamente una reservation WAITING.
  const txResult = await prisma.$transaction(async (tx) => {
    // Tentativo: occupa un posto riservato (capacity check atomico)
    const update = await tx.freshEvent.updateMany({
      where: {
        id: freshEventId,
        status: { in: ['PUBLISHED', 'FULL'] },
        reservedCount: { lt: event.capacity },
      },
      data: { reservedCount: { increment: 1 } },
    });

    if (update.count > 0) {
      // Posto riservato ottenuto → CONFIRMED (QR generato FUORI tx)
      const reservation = await tx.freshEventReservation.create({
        data: {
          freshEventId,
          beneficiaryId: session.id,
          status: 'CONFIRMED',
          position: null,
        },
      });

      // Aggiorna status slot a FULL se ora è pieno
      const fresh = await tx.freshEvent.findUnique({
        where: { id: freshEventId },
        select: { reservedCount: true, capacity: true },
      });
      if (fresh && fresh.reservedCount >= fresh.capacity) {
        await tx.freshEvent.update({
          where: { id: freshEventId },
          data: { status: 'FULL' },
        });
      }

      return { type: 'CONFIRMED' as const, reservation };
    }

    // Nessun posto riservato disponibile → WAITING
    const nextPos = await getNextWaitingPosition(freshEventId);
    const reservation = await tx.freshEventReservation.create({
      data: {
        freshEventId,
        beneficiaryId: session.id,
        status: 'WAITING',
        position: nextPos,
      },
    });

    // Incrementa waitingCount
    await tx.freshEvent.update({
      where: { id: freshEventId },
      data: { waitingCount: { increment: 1 } },
    });

    return { type: 'WAITING' as const, reservation };
  });

  // --- Effetti collaterali (best-effort, FUORI dalla transazione) -------
  const qrCodeData = makeFreshReservationQrCode(txResult.reservation.id, session.id);

  if (txResult.type === 'CONFIRMED') {
    // Genera QR code
    let qrCodeImageUrl: string | null = null;
    try {
      qrCodeImageUrl = await generateAndUploadQrCodeWithLogo(qrCodeData, `fresh-${txResult.reservation.id}.png`);
    } catch (err) {
      console.error(`[fresh-events/reserve] QR generation failed for ${txResult.reservation.id}:`, err);
    }

    // Salva qrCode sul record
    try {
      await prisma.freshEventReservation.update({
        where: { id: txResult.reservation.id },
        data: { qrCode: qrCodeData },
      });
    } catch (err) {
      console.error(`[fresh-events/reserve] Failed to attach QR to reservation ${txResult.reservation.id}:`, err);
    }

    // Notifica in-app
    try {
      await prisma.notification.create({
        data: {
          recipientUserId: session.id,
          recipientType: 'USER',
          title: `Prenotazione confermata: ${event.template.title}`,
          message: `La tua prenotazione per "${event.template.title}" del ${event.scheduledStart.toLocaleString('it-IT')} è confermata. Mostra il QR code al ritiro.`,
          type: 'FRESH_RESERVATION_CONFIRMED',
          link: '/recipient/fresh-events/my-reservations',
        },
      });
    } catch (err) {
      console.error(`[fresh-events/reserve] Failed to create notification:`, err);
    }

    // Email (riusa helper, sarà implementato nella fase notifiche)
    // Per ora placeholder: logghiamo solo
    try {
      const { sendFreshReservationQrNotification } = await import('@/lib/email');
      const recipientName =
        [beneficiary.firstName, beneficiary.lastName].filter(Boolean).join(' ') ||
        beneficiary.nickname ||
        beneficiary.name ||
        'Beneficiario';
      await sendFreshReservationQrNotification(
        beneficiary.email,
        session.id,
        recipientName,
        event.template.title,
        event.scheduledStart,
        event.scheduledEnd,
        txResult.reservation.id,
        qrCodeData,
        qrCodeImageUrl,
        event.template.organization.name,
        event.template.organization.address ?? null,
        event.template.organization.houseNumber ?? null,
        event.template.organization.cap ?? null,
        event.template.organization.city ?? null,
        event.template.organization.province ?? null,
        event.template.organization.phone ?? null,
        event.template.organization.email ?? null,
        event.template.organization.hoursInfo ?? undefined,
      );
    } catch (err) {
      // Non bloccare: il beneficiario vede QR dalla UI anche se email fallisce
      console.error(`[fresh-events/reserve] Email send failed:`, err);
    }

    return NextResponse.json({
      success: true,
      type: 'CONFIRMED',
      reservationId: txResult.reservation.id,
      qrCode: qrCodeData,
    });
  } else {
    // WAITING: nessun QR, solo notifica
    try {
      await prisma.notification.create({
        data: {
          recipientUserId: session.id,
          recipientType: 'USER',
          title: `Sei in lista d'attesa: ${event.template.title}`,
          message: `La tua richiesta per "${event.template.title}" del ${event.scheduledStart.toLocaleString('it-IT')} è in lista d'attesa (posizione ${txResult.reservation.position}). Riceverai una notifica se un posto si libera.`,
          type: 'FRESH_RESERVATION_CONFIRMED',
          link: '/recipient/fresh-events/my-reservations',
        },
      });
    } catch (err) {
      console.error(`[fresh-events/reserve] Failed to create waiting notification:`, err);
    }

    return NextResponse.json({
      success: true,
      type: 'WAITING',
      reservationId: txResult.reservation.id,
      position: txResult.reservation.position,
    });
  }
}, 'POST /api/recipient/fresh-events/[id]/reserve');
