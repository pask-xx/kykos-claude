import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const ADMIN_EMAIL = process.env.ADMIN_ADESIONI_EMAIL || 'candidature@kykos.it';
const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://kykos.it';
const LOGO_URL = `${APP_URL}/albero.svg`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token di conferma mancante' },
        { status: 400 }
      );
    }

    // Find the adesione with this token
    const adesione = await prisma.adesioneEnte.findFirst({
      where: {
        emailConfirmToken: token,
      },
    });

    if (!adesione) {
      return NextResponse.json(
        { error: 'Token non valido o scaduto' },
        { status: 404 }
      );
    }

    // Check if already confirmed
    if (adesione.emailConfirmed) {
      return NextResponse.json(
        { error: 'Email già confermata' },
        { status: 400 }
      );
    }

    // Mark as confirmed
    await prisma.adesioneEnte.update({
      where: { id: adesione.id },
      data: {
        emailConfirmed: true,
        emailConfirmToken: null, // Clear the token
      },
    });

    // Send notification to admin
    try {
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `[KYKOS] Richiesta di adesione confermata - ${adesione.denominazione}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px; text-align: center;">
                <img src="${LOGO_URL}" alt="KYKOS" width="64" height="64" style="height: 64px; width: 64px; margin-bottom: 16px;">
                <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Richiesta di adesione confermata</p>
              </div>
              <div style="padding: 32px;">
                <h2 style="color: #059669; margin-top: 0; font-size: 24px;">L&apos;ente ha confermato la richiesta</h2>
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                  La richiesta di adesione per <strong>${adesione.denominazione}</strong> è stata confermata via email dall&apos;ente stesso.
                </p>
                <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
                  <p style="margin: 0; color: #059669; font-weight: 600; font-size: 14px;">Dati dell&apos;ente:</p>
                  <p style="margin: 8px 0 0 0; color: #374151; font-size: 14px;">Denominazione: ${adesione.denominazione}</p>
                  <p style="margin: 4px 0; color: #374151; font-size: 14px;">Referente: ${adesione.nomeReferente} ${adesione.cognomeReferente}</p>
                  <p style="margin: 4px 0; color: #374151; font-size: 14px;">Email: ${adesione.email}</p>
                  <p style="margin: 4px 0; color: #374151; font-size: 14px;">Telefono: ${adesione.telefono}</p>
                  <p style="margin: 4px 0; color: #374151; font-size: 14px;">Indirizzo: ${adesione.indirizzo}, ${adesione.civico} - ${adesione.cap} ${adesione.citta}</p>
                  ${adesione.website ? `<p style="margin: 4px 0; color: #374151; font-size: 14px;">Sito web: ${adesione.website}</p>` : ''}
                </div>
                ${adesione.nota ? `
                <div style="margin-top: 16px;">
                  <p style="margin: 0; color: #374151; font-weight: 600; font-size: 14px;">Nota di presentazione:</p>
                  <p style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-top: 8px; color: #6b7280; font-size: 14px;">${adesione.nota}</p>
                </div>
                ` : ''}
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${APP_URL}/admin/dashboard?tab=adesioni" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Gestisci in Dashboard
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
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
      // Don't fail the confirmation if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Email confermata con successo. La tua richiesta sarà ora esaminata dal nostro team.',
    });
  } catch (error) {
    console.error('Adesione confirm error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}