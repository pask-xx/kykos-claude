import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hasAnyPermission } from '@/lib/permissions';

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

// POST /api/operator/multi-availability/[id]/notify-exhausted
// Invia notifica ai beneficiari NON assegnati
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
    const { customMessage } = body;

    const message = customMessage || availability.exhaustMessage ||
      'Spiacenti, le scorte sono esaurite. Non è stato possibile soddisfare la tua richiesta.';

    // Trova tutti i richiedenti PENDING non assegnati
    const pendingRequests = await prisma.multiAvailabilityRequest.findMany({
      where: {
        multiAvailabilityId: id,
        status: 'PENDING',
      },
      include: {
        beneficiary: {
          select: {
            id: true,
            email: true,
          }
        }
      },
    });

    if (pendingRequests.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nessun beneficiario da notificare',
        notified: 0,
      });
    }

    // Invia notifica a ogni beneficiario
    const notifications = [];
    for (const req of pendingRequests) {
      const notification = await prisma.notification.create({
        data: {
          recipientUserId: req.beneficiaryId,
          recipientType: 'USER',
          title: `Disponibilità esaurita: ${availability.title}`,
          message,
          type: 'OBJECT_CANCELLED' as any,
          link: '/recipient/dashboard',
        },
      });
      notifications.push(notification);

      // Segna come notificato
      await prisma.multiAvailabilityRequest.update({
        where: { id: req.id },
        data: {
          status: 'REJECTED',
          notifiedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      notified: notifications.length,
      message: `Notificate ${notifications.length} persone`,
    });
  } catch (error) {
    console.error('MultiAvailability notify exhausted error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}