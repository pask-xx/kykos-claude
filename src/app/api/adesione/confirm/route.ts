import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const ADMIN_EMAIL = process.env.ADMIN_ADESIONI_EMAIL || 'candidature@kykos.it';

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
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0;">KYKOS - Nuova Adesione Confermata</h1>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #059669; margin-top: 0;">L'ente ha confermato la richiesta</h2>
              <p>La richiesta di adesione per <strong>${adesione.denominazione}</strong> è stata confermata via email dall'ente stesso.</p>
              <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #059669; margin: 24px 0;">
                <p style="margin: 0;"><strong>Denominazione:</strong> ${adesione.denominazione}</p>
                <p style="margin: 8px 0 0 0;"><strong>Referente:</strong> ${adesione.nomeReferente} ${adesione.cognomeReferente}</p>
                <p style="margin: 4px 0;"><strong>Email:</strong> ${adesione.email}</p>
                <p style="margin: 4px 0;"><strong>Telefono:</strong> ${adesione.telefono}</p>
                <p style="margin: 4px 0;"><strong>Indirizzo:</strong> ${adesione.indirizzo}, ${adesione.civico} - ${adesione.cap} ${adesione.citta}</p>
                ${adesione.website ? `<p style="margin: 4px 0;"><strong>Sito web:</strong> ${adesione.website}</p>` : ''}
              </div>
              ${adesione.nota ? `
              <div style="margin-top: 16px;">
                <p style="margin: 0;"><strong>Nota di presentazione:</strong></p>
                <p style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-top: 8px;">${adesione.nota}</p>
              </div>
              ` : ''}
              <div style="margin-top: 24px;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://kykos.it'}/admin/dashboard?tab=adesioni" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Gestisci in Dashboard</a>
              </div>
            </div>
            <div style="background: #f9fafb; padding: 16px; text-align: center; color: #6b7280; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} KYKOS. Dona con amore, ricevi con dignità.</p>
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