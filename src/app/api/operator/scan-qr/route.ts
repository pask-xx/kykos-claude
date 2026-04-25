import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { parseQrCodeData, generateQrCodeDataUrl, generatePickupQrCode } from '@/lib/qrcode';
import { sendPickupQrNotification } from '@/lib/email';
import { hasPermission } from '@/lib/permissions';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

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

export async function POST(request: Request) {
  try {
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

    if (!hasPermission(operator.role, operator.permissions, 'OBJECT_DELIVER')) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const { qrData } = await request.json();

    console.log('Received qrData:', qrData, 'type:', typeof qrData);

    if (!qrData || typeof qrData !== 'string') {
      return NextResponse.json({ error: 'QR data mancante o non valida' }, { status: 400 });
    }

    const parsed = parseQrCodeData(qrData);
    if (!parsed) {
      return NextResponse.json({ error: 'QR code non valido' }, { status: 400 });
    }

    const { type, requestId, userId } = parsed;

    const req = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        object: {
          select: {
            id: true,
            title: true,
            status: true,
            donorId: true,
            donor: { select: { name: true } },
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!req) {
      return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
    }

    if (req.intermediaryId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    if (type === 'deliver') {
      // DELIVER QR: scanned when donor brings the object
      // Verify donor ID matches
      if (req.object.donorId !== userId) {
        return NextResponse.json({ error: 'QR code non valido per questo donatore' }, { status: 400 });
      }

      if (req.object.status !== 'RESERVED') {
        return NextResponse.json({ error: 'Oggetto non disponibile per la consegna' }, { status: 400 });
      }

      // Update object status to WITHDRAWN (object is at entity, waiting for pickup)
      await prisma.object.update({
        where: { id: req.objectId },
        data: { status: 'WITHDRAWN' },
      });

      // Generate pickup QR and send to beneficiary
      const pickupQrData = generatePickupQrCode(requestId, req.recipientId);
      const pickupQrImage = await generateQrCodeDataUrl(pickupQrData);
      await sendPickupQrNotification(
        req.recipient.email,
        req.recipient.name,
        req.object.title,
        pickupQrData,
        pickupQrImage
      );

      return NextResponse.json({
        success: true,
        type: 'deliver',
        message: 'Consegna registrata! Il beneficiario ricevera\' il QR code per il ritiro.',
        data: {
          objectTitle: req.object.title,
          donorName: req.object.donor?.name || 'Donatore',
        },
      });
    } else {
      // PICKUP QR: scanned when beneficiary comes to pick up
      // Verify recipient ID matches
      if (req.recipientId !== userId) {
        return NextResponse.json({ error: 'QR code non valido per questo destinatario' }, { status: 400 });
      }

      if (req.object.status !== 'WITHDRAWN') {
        return NextResponse.json({ error: 'Oggetto non ancora pronto per il ritiro' }, { status: 400 });
      }

      // Mark as DONATED (final delivery)
      await prisma.object.update({
        where: { id: req.objectId },
        data: { status: 'DONATED' },
      });

      return NextResponse.json({
        success: true,
        type: 'pickup',
        message: 'Ritiro completato! Oggetto consegnato al beneficiario.',
        data: {
          objectTitle: req.object.title,
          recipientName: req.recipient.name,
        },
      });
    }
  } catch (error) {
    console.error('QR scan error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
