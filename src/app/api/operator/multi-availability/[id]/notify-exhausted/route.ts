import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hasAnyPermission } from '@/lib/permissions';
import { sendEmail } from '@/lib/email';

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
            name: true,
            firstName: true,
            lastName: true,
            nickname: true,
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

      // Segna come notificato e aggiorna stato
      await prisma.multiAvailabilityRequest.update({
        where: { id: req.id },
        data: {
          status: 'REJECTED',
          notifiedAt: new Date(),
        },
      });

      // Invia email effettiva
      const beneficiaryName = [req.beneficiary.firstName, req.beneficiary.lastName]
        .filter(Boolean).join(' ') || req.beneficiary.nickname || req.beneficiary.name;
      const subject = `KYKOS - Disponibilità esaurita: ${availability.title}`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px; text-align: center;">
              <img src="${process.env.NEXT_PUBLIC_BASE_URL}/albero.svg" alt="KYKOS" style="height: 64px;">
              <img src="${process.env.NEXT_PUBLIC_BASE_URL}/LogoKykosTesto.svg" alt="KYKOS" style="height: 64px; margin-left: 2px;">
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Disponibilità esaurita</p>
            </div>
            <div style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Ciao ${beneficiaryName},</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                spiace comunicarti che la disponibilità <strong>"${availability.title}"</strong> non è più disponibile.</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                ${message}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0;">
                © ${new Date().getFullYear()} KYKOS. Dona con amore, ricevi con dignità.<br>
                Non rispondere a questa email.
              </p>
            </div>
          </div>
        </div>
      `;
      await sendEmail({ to: req.beneficiary.email, subject, html });
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