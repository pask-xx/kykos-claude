import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);
const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://kykos.it';
const LOGO_URL = `${APP_URL}/albero.svg`;

// Build ente creation URL
const getEnteCreationUrl = (enteId?: string) =>
  enteId ? `${APP_URL}/admin/intermediaries/new?from=adesione&enteId=${enteId}` : `${APP_URL}/admin/intermediaries/new`;

interface UserSession {
  userId: string;
  role: string;
}

async function getUserSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userPayload = payload.user as { id: string; role: string } | undefined;
    if (!userPayload?.id) return null;
    return { userId: userPayload.id, role: userPayload.role || 'DONOR' };
  } catch {
    return null;
  }
}

// GET single adhesion request by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id } = await params;
    const adesione = await prisma.adesioneEnte.findUnique({
      where: { id },
    });

    if (!adesione) {
      return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
    }

    return NextResponse.json({ adesione });
  } catch (error) {
    console.error('Adesione get error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// PATCH to approve/reject adhesion request
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id } = await params;
    const action = new URL(request.url).searchParams.get('action');

    if (!id || !action) {
      return NextResponse.json({ error: 'ID e azione sono obbligatori' }, { status: 400 });
    }

    const adesione = await prisma.adesioneEnte.findUnique({
      where: { id },
    });

    if (!adesione) {
      return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
    }

    // Only allow approve/reject on email-confirmed requests
    if (!adesione.emailConfirmed) {
      return NextResponse.json(
        { error: 'Non è possibile gestire richieste non confermate via email' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      await prisma.adesioneEnte.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      // Send approval email
      try {
        await sendEmail({
          to: adesione.email,
          subject: 'KYKOS - Adesione approvata!',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
              <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px; text-align: center;">
                  <img src="${LOGO_URL}" alt="KYKOS" width="64" height="64" style="height: 64px; width: 64px; margin-bottom: 16px;">
                  <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Adesione approvata!</p>
                </div>
                <div style="padding: 32px;">
                  <h2 style="color: #059669; margin-top: 0; font-size: 24px;">Gentile ${adesione.nomeReferente} ${adesione.cognomeReferente},</h2>
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                    La richiesta di adesione per <strong>${adesione.denominazione}</strong> è stata approvata! Riceverai a breve le credenziali per accedere alla dashboard dell'ente.
                  </p>
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
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }

      return NextResponse.json({ success: true, message: 'Richiesta approvata' });

    } else if (action === 'reject') {
      await prisma.adesioneEnte.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      // Send rejection email
      try {
        await sendEmail({
          to: adesione.email,
          subject: 'KYKOS - Adesione non approvata',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
              <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px; text-align: center;">
                  <img src="${LOGO_URL}" alt="KYKOS" width="64" height="64" style="height: 64px; width: 64px; margin-bottom: 16px;">
                  <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Adesione non approvata</p>
                </div>
                <div style="padding: 32px;">
                  <h2 style="color: #dc2626; margin-top: 0; font-size: 24px;">Gentile ${adesione.nomeReferente} ${adesione.cognomeReferente},</h2>
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                    La richiesta di adesione per <strong>${adesione.denominazione}</strong> non è stata approvata in questa fase.
                  </p>
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                    Se credi che ci sia stato un errore o vuoi maggiori informazioni, contattaci.
                  </p>
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
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
      }

      return NextResponse.json({ success: true, message: 'Richiesta rifiutata' });

    } else {
      return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Adesione action error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}