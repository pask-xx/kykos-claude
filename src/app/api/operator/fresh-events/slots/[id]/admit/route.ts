// =============================================================
// POST /api/operator/fresh-events/slots/[id]/admit
// Ammette N beneficiari da waiting list → ADMITTED + QR generato.
// CONCORRENCY-SAFE: transazione con updateMany condizionato.
// Effetti collaterali (QR, notifica, email) FUORI dalla transazione.
// =============================================================

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getJwtSecret } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';
import { generateAndUploadQrCodeWithLogo } from '@/lib/qrcode';
import { makeFreshReservationQrCode } from '@/lib/fresh-events';

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

const admitSchema = z.object({
  reservationIds: z.array(z.string()).min(1),
});

export const POST = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: slotId } = await params;
  const session = await getOperatorSession();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const operator = await prisma.operator.findUnique({ where: { id: session.operatorId } });
  if (!operator || !operator.active) {
    return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
  }

  const body = await request.json();
  const parsed = admitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
  }

  const { reservationIds } = parsed.data;
  const uniqueIds = Array.from(new Set(reservationIds));

  // Verifica slot
  const slot = await prisma.freshEvent.findUnique({
    where: { id: slotId },
    select: {
      id: true,
      capacity: true,
      reservedCount: true,
      status: true,
      template: {
        select: { id: true, title: true, organizationId: true },
      },
    },
  });

  if (!slot || slot.template.organizationId !== session.organizationId) {
    return NextResponse.json({ error: 'Slot non trovato' }, { status: 404 });
  }

  if (slot.status === 'CLOSED' || slot.status === 'COMPLETED' || slot.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Slot non più attivo' }, { status: 400 });
  }

  // Capacità disponibile
  const free = slot.capacity - slot.reservedCount;
  if (free <= 0) {
    return NextResponse.json(
      { error: 'Nessun posto disponibile. Il beneficiario ha già cancellato?' },
      { status: 400 },
    );
  }

  if (uniqueIds.length > free) {
    return NextResponse.json(
      { error: `Puoi ammettere al massimo ${free} beneficiari` },
      { status: 400 },
    );
  }

  // --- Transazione: ammissione atomica + capacity check -----------------
  const txResult = await prisma.$transaction(async (tx) => {
    const claimed: { reservationId: string; beneficiaryId: string }[] = [];

    for (const resId of uniqueIds) {
      // updateMany condizionato su status: 'WAITING' (atomico, race-safe)
      const upd = await tx.freshEventReservation.updateMany({
        where: {
          id: resId,
          freshEventId: slotId,
          status: 'WAITING',
        },
        data: {
          status: 'ADMITTED',
          admittedAt: new Date(),
        },
      });

      if (upd.count === 0) continue;

      // Recupera beneficiaryId
      const res = await tx.freshEventReservation.findUnique({
        where: { id: resId },
        select: { beneficiaryId: true },
      });
      if (res) claimed.push({ reservationId: resId, beneficiaryId: res.beneficiaryId });
    }

    if (claimed.length === 0) {
      return { claimed: [] as { reservationId: string; beneficiaryId: string }[] };
    }

    // Capacity check + increment atomico reservedCount
    const fresh = await tx.freshEvent.findUnique({
      where: { id: slotId },
      select: { reservedCount: true, capacity: true },
    });
    if (!fresh) throw new Error('Slot disappeared mid-transaction');

    const newReserved = fresh.reservedCount + claimed.length;
    if (newReserved > fresh.capacity) {
      throw new Error(`Superata capacità. Liberi: ${fresh.capacity - fresh.reservedCount}`);
    }

    await tx.freshEvent.update({
      where: { id: slotId },
      data: {
        reservedCount: { increment: claimed.length },
        waitingCount: { decrement: claimed.length },
        // Se torna pieno, FULL
        status: newReserved >= fresh.capacity ? 'FULL' : 'PUBLISHED',
      },
    });

    return { claimed };
  });

  // --- Effetti collaterali (best-effort, FUORI tx) ---------------------
  // Genera QR + notifica per ogni ammissione
  const admitted: { reservationId: string; qrCode: string; qrCodeImageUrl: string | null }[] = [];

  for (const { reservationId, beneficiaryId } of txResult.claimed) {
    const qrCodeData = makeFreshReservationQrCode(reservationId, beneficiaryId);
    let qrCodeImageUrl: string | null = null;

    try {
      qrCodeImageUrl = await generateAndUploadQrCodeWithLogo(qrCodeData, `fresh-${reservationId}.png`);
    } catch (err) {
      console.error(`[fresh-events/admit] QR generation failed for ${reservationId}:`, err);
    }

    try {
      await prisma.freshEventReservation.update({
        where: { id: reservationId },
        data: { qrCode: qrCodeData },
      });
    } catch (err) {
      console.error(`[fresh-events/admit] Failed to attach QR to ${reservationId}:`, err);
    }

    try {
      await prisma.notification.create({
        data: {
          recipientUserId: beneficiaryId,
          recipientType: 'USER',
          title: `Sei stato ammesso: ${slot.template.title}`,
          message: `Un posto si è liberato per "${slot.template.title}". Mostra il QR code al ritiro.`,
          type: 'FRESH_WAITING_LIST_ADMITTED',
          link: '/recipient/fresh-events/my-reservations',
        },
      });
    } catch (err) {
      console.error(`[fresh-events/admit] Failed to create notification:`, err);
    }

    admitted.push({ reservationId, qrCode: qrCodeData, qrCodeImageUrl });
  }

  return NextResponse.json({ success: true, admitted });
}, 'POST /api/operator/fresh-events/slots/[id]/admit');
