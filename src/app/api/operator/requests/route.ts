import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hasPermission, hasAnyPermission } from '@/lib/permissions';
import { generateDeliverQrCode, generatePickupQrCode, generateAndUploadQrCode } from '@/lib/qrcode';
import { sendDeliveryQrNotification } from '@/lib/email';

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

export async function GET() {
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

    // Check permission
    if (!hasAnyPermission(operator.role, operator.permissions, ['RECIPIENT_AUTHORIZE', 'REQUEST_PROXY'])) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const requests = await prisma.request.findMany({
      where: { intermediaryId: session.organizationId },
      include: {
        object: {
          select: {
            id: true,
            title: true,
            imageUrls: true,
            category: true,
            condition: true,
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Operator requests error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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

    // Check permission
    if (!hasAnyPermission(operator.role, operator.permissions, ['RECIPIENT_AUTHORIZE', 'REQUEST_PROXY'])) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const { requestId, action } = await request.json();

    if (!requestId || !action) {
      return NextResponse.json({ error: 'requestId e action sono obbligatori' }, { status: 400 });
    }

    const requestData = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!requestData) {
      return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
    }

    if (requestData.intermediaryId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    if (action === 'approve') {
      // Get full request data with donor and organization info
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

      // Get organization details
      const org = await prisma.organization.findUnique({
        where: { id: session.organizationId },
        select: { name: true, address: true, houseNumber: true, cap: true, city: true, province: true, phone: true, email: true, hoursInfo: true },
      });

      // Generate QR codes
      const deliverQrData = generateDeliverQrCode(requestId, req.object.donorId);
      const pickupQrData = generatePickupQrCode(requestId, req.recipientId);
      const deliverQrImage = await generateAndUploadQrCode(deliverQrData, `deliver-${requestId}.png`);

      // Update request, object and create donation in transaction
      await prisma.$transaction(async (tx) => {
        await tx.request.update({
          where: { id: requestId },
          data: { status: 'APPROVED' },
        });

        await tx.object.update({
          where: { id: req.objectId },
          data: { status: 'RESERVED' },
        });

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

      // Send Delivery QR to donor
      await sendDeliveryQrNotification(
        req.object.donor.email,
        req.object.donor.name,
        req.object.title,
        deliverQrData,
        deliverQrImage,
        org?.name || '',
        org?.address,
        org?.houseNumber,
        org?.cap,
        org?.city,
        org?.province,
        org?.phone,
        org?.email,
        org?.hoursInfo
      );
    } else if (action === 'reject') {
      await prisma.request.update({
        where: { id: requestId },
        data: { status: 'REJECTED' },
      });
    } else {
      return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Operator requests PATCH error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
