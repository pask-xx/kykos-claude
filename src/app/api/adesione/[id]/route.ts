import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

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

// GET all adhesion requests (for admin)
export async function GET() {
  try {
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const requests = await prisma.adesioneEnte.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Adesione list error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// PATCH to approve/reject adhesion request
export async function PATCH(request: Request) {
  try {
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action'); // 'approve' or 'reject'

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
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0;">KYKOS</h1>
              </div>
              <div style="padding: 32px;">
                <h2 style="color: #059669; margin-top: 0;">Gentile ${adesione.nomeReferente} ${adesione.cognomeReferente},</h2>
                <p>La richiesta di adesione per <strong>${adesione.denominazione}</strong> è stata approvata!</p>
                <p>Ora potrai creare l'account dell'ente dalla dashboard admin.</p>
                <div style="margin-top: 24px;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://kykos.it'}/admin/dashboard" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Vai alla Dashboard</a>
                </div>
              </div>
              <div style="background: #f9fafb; padding: 16px; text-align: center; color: #6b7280; font-size: 12px;">
                <p style="margin: 0;">© ${new Date().getFullYear()} KYKOS. Dona con amore, ricevi con dignità.</p>
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
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0;">KYKOS</h1>
              </div>
              <div style="padding: 32px;">
                <h2 style="color: #dc2626; margin-top: 0;">Gentile ${adesione.nomeReferente} ${adesione.cognomeReferente},</h2>
                <p>La richiesta di adesione per <strong>${adesione.denominazione}</strong> non è stata approvata in questa fase.</p>
                <p>Se credi che ci sia stato un errore o vuoi maggiori informazioni, contattaci.</p>
              </div>
              <div style="background: #f9fafb; padding: 16px; text-align: center; color: #6b7280; font-size: 12px;">
                <p style="margin: 0;">© ${new Date().getFullYear()} KYKOS. Dona con amore, ricevi con dignità.</p>
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