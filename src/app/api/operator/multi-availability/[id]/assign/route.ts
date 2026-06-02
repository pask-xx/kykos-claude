import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hasAnyPermission } from '@/lib/permissions';
import { randomBytes } from 'crypto';
import { sendMultiAvailabilityQrNotification } from '@/lib/email';
import { generateAndUploadQrCodeWithLogo } from '@/lib/qrcode';
import { getJwtSecret } from '@/lib/auth';

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

// POST /api/operator/multi-availability/[id]/assign - Assegna beneficiari selezionati
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    if (!hasAnyPermission(operator.role, operator.permissions, ['ORGANIZATION_ADMIN'])) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const availability = await prisma.multiAvailability.findUnique({
      where: { id },
    });

    if (!availability || availability.organizationId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const { requestIds } = body;

    if (!Array.isArray(requestIds)) {
      return NextResponse.json({ error: 'requestIds deve essere un array' }, { status: 400 });
    }

    // Ottieni i request IDs e i relativi beneficiary IDs
    const requests = await prisma.multiAvailabilityRequest.findMany({
      where: {
        id: { in: requestIds },
        multiAvailabilityId: id,
        status: 'PENDING',
      },
      select: {
        id: true,
        beneficiaryId: true,
      },
    });

    if (requests.length === 0) {
      return NextResponse.json({ error: 'Nessuna richiesta trovuta da assegnare' }, { status: 400 });
    }

    // Verifica che non si superi la quantità disponibile
    const currentlyAssigned = await prisma.multiAvailabilityRequest.count({
      where: {
        multiAvailabilityId: id,
        status: 'ASSIGNED',
      }
    });

    const newAssignments = requests.length;
    if (currentlyAssigned + newAssignments > availability.availableQty) {
      return NextResponse.json({
        error: `Superata la quantità disponibile. Disponibili: ${availability.availableQty - currentlyAssigned}`
      }, { status: 400 });
    }

    // Genera QR code per ogni beneficiario assegnato
    const qrCodes: string[] = [];
    for (const req of requests) {
      // Ottieni tutti i dettagli del beneficiario
      const beneficiary = await prisma.user.findUnique({
        where: { id: req.beneficiaryId },
        select: {
          needScore: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
          nickname: true,
        }
      });

      if (!beneficiary) continue;

      // Genera QR code nel nuovo formato
      const qrCodeData = `kykos:multiavailability:pickup:${req.id}:${req.beneficiaryId}`;
      const qrCodeImageUrl = await generateAndUploadQrCodeWithLogo(qrCodeData, `multi-avail-${req.id}.png`);

      await prisma.multiAvailabilityRequest.update({
        where: { id: req.id },
        data: {
          status: 'ASSIGNED',
          qrCode: qrCodeData,
          needScoreSnapshot: beneficiary.needScore ?? 50,
        },
      });
      qrCodes.push(qrCodeData);

      // Invia email con QR code
      const recipientName = [beneficiary.firstName, beneficiary.lastName].filter(Boolean).join(' ') || beneficiary.nickname || beneficiary.name || 'Beneficiario';

      // Recupera info organizzazione per l'email
      const organization = await prisma.organization.findUnique({
        where: { id: session.organizationId },
        select: {
          name: true,
          address: true,
          houseNumber: true,
          cap: true,
          city: true,
          province: true,
          phone: true,
          email: true,
          hoursInfo: true,
        }
      });

      await sendMultiAvailabilityQrNotification(
        beneficiary.email,
        req.beneficiaryId,
        recipientName,
        availability.title,
        availability.id,
        qrCodeData,
        qrCodeImageUrl,
        organization?.name || '',
        organization?.address || null,
        organization?.houseNumber || null,
        organization?.cap || null,
        organization?.city || null,
        organization?.province || null,
        organization?.phone || null,
        organization?.email || null,
        organization?.hoursInfo || undefined
      );

      // Invia notifica
      await prisma.notification.create({
        data: {
          recipientUserId: req.beneficiaryId,
          recipientType: 'USER',
          title: `Assegnazione confermata: ${availability.title}`,
          message: `La tua richiesta per "${availability.title}" è stata accettata. Il tuo QR code per il ritiro è pronto.`,
          type: 'REQUEST_APPROVED' as any,
          link: '/recipient/dashboard',
        },
      });
    }

    // Aggiorna assignedQty
    const newAssignedCount = await prisma.multiAvailabilityRequest.count({
      where: {
        multiAvailabilityId: id,
        status: { in: ['ASSIGNED', 'FULFILLED'] }
      }
    });

    await prisma.multiAvailability.update({
      where: { id },
      data: { assignedQty: newAssignedCount },
    });

    return NextResponse.json({
      success: true,
      assigned: requests.length,
      qrCodes,
    });
  } catch (error) {
    console.error('MultiAvailability assign error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}