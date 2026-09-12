// =============================================================
// POST /api/operator/fresh-events/slots/[id]/scan-pickup
// Scan QR per registrare PICKED_UP.
// Body: { qrCode: string }
// Verifica formato, validità, status, e marca la reservation come ritirata.
// =============================================================

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getJwtSecret } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';
import { parseQrCodeData } from '@/lib/qrcode';

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

const scanSchema = z.object({
  qrCode: z.string().min(1),
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
  const parsed = scanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'QR code mancante' }, { status: 400 });
  }

  // Parsing QR (formato kykos:fresh:pickup:reservationId:userId)
  const parsed_qr = parseQrCodeData(parsed.data.qrCode);
  if (!parsed_qr || parsed_qr.subType !== 'fresh' || parsed_qr.type !== 'pickup') {
    return NextResponse.json({ error: 'QR code non valido per prodotti freschi' }, { status: 400 });
  }

  const reservationId = parsed_qr.requestId;
  const beneficiaryId = parsed_qr.userId;

  // Verifica che la reservation appartenga a questo slot
  const reservation = await prisma.freshEventReservation.findUnique({
    where: { id: reservationId },
    select: {
      id: true,
      beneficiaryId: true,
      status: true,
      qrCode: true,
      freshEventId: true,
      beneficiary: {
        select: { firstName: true, lastName: true, nickname: true, name: true },
      },
    },
  });

  if (!reservation || reservation.freshEventId !== slotId) {
    return NextResponse.json({ error: 'Prenotazione non trovata per questo slot' }, { status: 404 });
  }

  if (reservation.beneficiaryId !== beneficiaryId) {
    return NextResponse.json({ error: 'QR code non corrispondente al beneficiario' }, { status: 400 });
  }

  if (reservation.status === 'PICKED_UP') {
    return NextResponse.json(
      { error: 'QR già utilizzato per il ritiro' },
      { status: 400 },
    );
  }

  if (reservation.status !== 'CONFIRMED' && reservation.status !== 'ADMITTED') {
    return NextResponse.json(
      { error: `Impossibile ritirare: stato prenotazione = ${reservation.status}` },
      { status: 400 },
    );
  }

  // Marca come ritirato
  await prisma.freshEventReservation.update({
    where: { id: reservationId },
    data: {
      status: 'PICKED_UP',
      pickedUpAt: new Date(),
    },
  });

  const recipientName =
    [reservation.beneficiary.firstName, reservation.beneficiary.lastName].filter(Boolean).join(' ') ||
    reservation.beneficiary.nickname ||
    reservation.beneficiary.name ||
    'Beneficiario';

  return NextResponse.json({
    success: true,
    pickedUpAt: new Date().toISOString(),
    beneficiary: {
      name: recipientName,
    },
  });
}, 'POST /api/operator/fresh-events/slots/[id]/scan-pickup');
