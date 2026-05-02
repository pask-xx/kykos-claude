import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { randomBytes } from 'crypto';

const ADMIN_EMAIL = process.env.ADMIN_ADESIONI_EMAIL || 'candidature@kykos.it';
const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://kykos.it';
const LOGO_URL = `${APP_URL}/albero.svg`;

interface AdesioneRequest {
  denominazione: string;
  nomeReferente: string;
  cognomeReferente: string;
  telefono: string;
  email: string;
  indirizzo: string;
  civico: string;
  cap: string;
  citta: string;
  provincia?: string;
  nota: string;
  website?: string;
}

export async function POST(request: Request) {
  try {
    const body: AdesioneRequest = await request.json();

    // Validate required fields
    const requiredFields = [
      'denominazione', 'nomeReferente', 'cognomeReferente',
      'telefono', 'email', 'indirizzo', 'civico', 'cap', 'citta', 'nota'
    ];

    for (const field of requiredFields) {
      if (!body[field as keyof AdesioneRequest]) {
        return NextResponse.json(
          { error: `Campo obbligatorio mancante: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Email non valida' },
        { status: 400 }
      );
    }

    // Validate CAP (Italian postal code - 5 digits)
    const capRegex = /^\d{5}$/;
    if (!capRegex.test(body.cap)) {
      return NextResponse.json(
        { error: 'CAP non valido (5 cifre)' },
        { status: 400 }
      );
    }

    // Generate confirmation token
    const emailConfirmToken = randomBytes(32).toString('hex');

    // Save the request
    const adesione = await prisma.adesioneEnte.create({
      data: {
        denominazione: body.denominazione,
        nomeReferente: body.nomeReferente,
        cognomeReferente: body.cognomeReferente,
        telefono: body.telefono,
        email: body.email,
        indirizzo: body.indirizzo,
        civico: body.civico,
        cap: body.cap,
        citta: body.citta,
        provincia: body.provincia || null,
        nota: body.nota,
        website: body.website || null,
        status: 'PENDING',
        emailConfirmToken,
        emailConfirmed: false,
      },
    });

    // Build confirmation URL
    const confirmUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://kykos.it'}/adesione/confirm?token=${emailConfirmToken}`;

    // Send confirmation email to the requester
    try {
      await sendEmail({
        to: body.email,
        subject: 'KYKOS - Conferma la tua richiesta di adesione',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px; text-align: center;">
                <img src="${LOGO_URL}" alt="KYKOS" width="64" height="64" style="height: 64px; width: 64px; margin-bottom: 16px;">
                <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Conferma la tua richiesta</p>
              </div>
              <div style="padding: 32px;">
                <h2 style="color: #059669; margin-top: 0; font-size: 24px;">Gentile ${body.nomeReferente},</h2>
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                  Abbiamo ricevuto la tua richiesta di adesione per l&apos;ente <strong>${body.denominazione}</strong>.
                </p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                  Per confermare la richiesta, clicca sul pulsante qui sotto:
                </p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${confirmUrl}" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Conferma richiesta
                  </a>
                </div>
                <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
                  <p style="margin: 0; color: #059669; font-weight: 600;">Dati della richiesta:</p>
                  <p style="margin: 8px 0 0 0; color: #374151; font-size: 14px;">Ente: ${body.denominazione}</p>
                  <p style="margin: 4px 0; color: #374151; font-size: 14px;">Referente: ${body.nomeReferente} ${body.cognomeReferente}</p>
                  <p style="margin: 4px 0; color: #374151; font-size: 14px;">Email: ${body.email}</p>
                  <p style="margin: 4px 0; color: #374151; font-size: 14px;">Telefono: ${body.telefono}</p>
                </div>
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  Se non hai richiesto tu questa adesione, ignora questa email.
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
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Send notification to admin
    try {
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `[KYKOS] Nuova richiesta di adesione - ${body.denominazione}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px; text-align: center;">
                <img src="${LOGO_URL}" alt="KYKOS" width="64" height="64" style="height: 64px; width: 64px; margin-bottom: 16px;">
                <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Nuova richiesta di adesione</p>
              </div>
              <div style="padding: 32px;">
                <h2 style="color: #dc2626; margin-top: 0; font-size: 24px;">Nuova richiesta di adesione ente</h2>
                <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
                  <p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>Denominazione:</strong> ${body.denominazione}</p>
                  <p style="margin: 8px 0 0 0; color: #991b1b; font-size: 14px;"><strong>Referente:</strong> ${body.nomeReferente} ${body.cognomeReferente}</p>
                  <p style="margin: 4px 0; color: #991b1b; font-size: 14px;"><strong>Email:</strong> ${body.email}</p>
                  <p style="margin: 4px 0; color: #991b1b; font-size: 14px;"><strong>Telefono:</strong> ${body.telefono}</p>
                  <p style="margin: 4px 0; color: #991b1b; font-size: 14px;"><strong>Indirizzo:</strong> ${body.indirizzo}, ${body.civico} - ${body.cap} ${body.citta}${body.provincia ? ` (${body.provincia})` : ''}</p>
                  ${body.website ? `<p style="margin: 4px 0; color: #991b1b; font-size: 14px;"><strong>Sito web:</strong> ${body.website}</p>` : ''}
                </div>
                ${body.nota ? `
                <div style="margin-top: 16px;">
                  <p style="margin: 0; color: #374151; font-weight: 600;">Nota di presentazione:</p>
                  <p style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-top: 8px; color: #6b7280; font-size: 14px;">${body.nota}</p>
                </div>
                ` : ''}
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${APP_URL}/admin/dashboard" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
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
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Richiesta di adesione inviata con successo',
      id: adesione.id,
    });
  } catch (error) {
    console.error('Adesione error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get all requests for admin dashboard (including unconfirmed for visibility)
    const requests = await prisma.adesioneEnte.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Adesione GET error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}