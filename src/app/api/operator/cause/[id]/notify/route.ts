import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
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

    const cause = await prisma.cause.findUnique({
      where: { id },
      include: {
        organization: true,
        participants: {
          include: { user: true },
        },
      },
    });

    if (!cause) {
      return NextResponse.json({ error: 'Causa non trovata' }, { status: 404 });
    }

    if (cause.organizationId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const { message, sendEmail: shouldSendEmail } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Messaggio obbligatorio' }, { status: 400 });
    }

    const notificationTitle = `Messaggio sulla causa: ${cause.title}`;

    // Invia notifica e email a ogni partecipante
    for (const participant of cause.participants) {
      const user = participant.user;

      // Notifica in-app
      await prisma.notification.create({
        data: {
          title: notificationTitle,
          message: message.trim(),
          type: 'CAUSE_MESSAGE',
          recipientType: 'USER',
          recipientUserId: user.id,
          link: `/causes/${cause.id}`,
        },
      });

      // Email se richiesto
      if (shouldSendEmail && user.email) {
        const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://kykos.it';
        const LOGO_URL = `${APP_URL}/albero.svg`;

        await sendEmail({
          to: user.email,
          subject: notificationTitle,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
              <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px; text-align: center;">
                  <img src="${LOGO_URL}" alt="KYKOS" width="64" height="64" style="height: 64px; width: 64px; margin-bottom: 16px;">
                  <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Nuovo messaggio su una causa</p>
                </div>
                <div style="padding: 32px;">
                  <h2 style="color: #059669; margin-top: 0; font-size: 24px;">${cause.title}</h2>
                  <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
                    <p style="margin: 0; color: #374151; font-size: 14px; white-space: pre-wrap;">${message.trim()}</p>
                  </div>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${APP_URL}/causes/${cause.id}" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Vedi la causa
                    </a>
                  </div>
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                  <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0;">
                    © ${new Date().getFullYear()} KYKOS. Dona con amore, ricevi con dignità.<br>
                    Non rispondere a questa email.
                  </p>
                </div>
              </div>
            </div>
          `,
        });
      }
    }

    return NextResponse.json({ success: true, sent: cause.participants.length });
  } catch (error) {
    console.error('Cause notify error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
