import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { generatePickupQrCode, generateAndUploadQrCodeWithLogo } from '@/lib/qrcode';
import { getJwtSecret } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';

const JWT_SECRET = getJwtSecret();

interface OperatorSession {
  operatorId: string;
  organizationId: string;
  username: string;
  role: string;
  isStreetOperator: boolean;
  isOfficeOperator: boolean;
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

// GET /api/operator/operator-qr-pickup/[requestId]
// Ritorna il QR pickup per un OBJECT DEPOSITED di un beneficiario street-managed.
// Usato dalla pagina /operator/operator-qr-pickup/[requestId] (sostituisce
// il vecchio qrLink rotto /operator/scan-qr/pickup/[id]).
//
// Shape risposta: standardizzata per il `transform` di <QrPage>.
// NON espone donor.name (regola anonimato KYKOS: l'operatore street vede
// solo il beneficiario per gestire la logistica fisica, mai il donatore
// in questo contesto di ritiro).
export const GET = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) => {
  const session = await getOperatorSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  if (!session.isStreetOperator) {
    return NextResponse.json({ error: 'Solo operatori di strada' }, { status: 403 });
  }

  const { requestId } = await params;

  // Fetch Request con select Prisma MINIMO (no donor.name per anonimato)
  const req = await prisma.request.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      objectId: true,
      recipientId: true,
      object: {
        select: {
          id: true,
          title: true,
          status: true,
          category: true,
        },
      },
      recipient: {
        select: {
          id: true,
          firstName: true,
          nickname: true,
          isStreetManaged: true,
          managedByStreetOperators: {
            where: { streetOperatorId: session.operatorId },
            select: { streetOperatorId: true },
          },
        },
      },
      intermediary: {
        select: {
          id: true,
          name: true,
          address: true,
          houseNumber: true,
          cap: true,
          city: true,
          province: true,
          hoursInfo: true,
        },
      },
    },
  });

  if (!req) {
    return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
  }
  if (req.object.status !== 'DEPOSITED') {
    return NextResponse.json(
      { error: 'QR ritiro disponibile solo per oggetti DEPOSITED' },
      { status: 400 }
    );
  }
  if (!req.recipient.isStreetManaged) {
    return NextResponse.json(
      { error: 'Beneficiario non gestito da street operator' },
      { status: 403 }
    );
  }
  if (req.recipient.managedByStreetOperators.length === 0) {
    return NextResponse.json(
      { error: 'Beneficiario non assegnato a te' },
      { status: 403 }
    );
  }

  // Genera QR pickup (formato kykos:object:pickup:requestId:recipientId)
  const qrData = generatePickupQrCode(req.id, req.recipientId, 'object');

  let qrImageUrl: string;
  try {
    qrImageUrl = await generateAndUploadQrCodeWithLogo(
      qrData,
      `street-pickup-${req.id}.png`
    );
  } catch (err) {
    console.error('Error generating QR image:', err);
    return NextResponse.json(
      { error: 'Impossibile generare immagine QR' },
      { status: 500 }
    );
  }

  // BeneficiaryName: solo nickname (regola anonimato) o firstName
  const beneficiaryName = req.recipient.nickname
    ? `@${req.recipient.nickname}`
    : req.recipient.firstName;

  return NextResponse.json({
    qrData,
    qrImageUrl,
    title: req.object.title,
    description: `Mostra questo QR code al beneficiario per il ritiro dell'oggetto "${req.object.title}".`,
    label: 'Ritiro',
    entityName: req.intermediary.name,
    entityHoursInfo: req.intermediary.hoursInfo,
    beneficiary: {
      id: req.recipient.id,
      name: beneficiaryName,
    },
  });
}, 'GET /api/operator/operator-qr-pickup/[requestId]');
