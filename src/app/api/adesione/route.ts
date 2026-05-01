import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { randomBytes } from 'crypto';

const ADMIN_EMAIL = process.env.ADMIN_ADESIONI_EMAIL || 'candidature@kykos.it';

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
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0;">KYKOS</h1>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #059669; margin-top: 0;">Gentile ${body.nomeReferente},</h2>
              <p>Abbiamo ricevuto la tua richiesta di adesione per l'ente <strong>${body.denominazione}</strong>.</p>
              <p>Per confermare la richiesta, clicca sul pulsante qui sotto:</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${confirmUrl}" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Conferma richiesta
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">Se non hai richiesto tu questa adesione, ignora questa email.</p>
              <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; color: #059669;"><strong>Dati della richiesta:</strong></p>
                <p style="margin: 8px 0 0 0;">Ente: ${body.denominazione}</p>
                <p style="margin: 4px 0;">Referente: ${body.nomeReferente} ${body.cognomeReferente}</p>
                <p style="margin: 4px 0;">Email: ${body.email}</p>
                <p style="margin: 4px 0;">Telefono: ${body.telefono}</p>
              </div>
            </div>
            <div style="background: #f9fafb; padding: 16px; text-align: center; color: #6b7280; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} KYKOS. Dona con amore, ricevi con dignità.</p>
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
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0;">KYKOS - Nuova Adesione</h1>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #dc2626; margin-top: 0;">Nuova richiesta di adesione ente</h2>
              <div style="background: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #dc2626;">
                <p style="margin: 0;"><strong>Denominazione:</strong> ${body.denominazione}</p>
                <p style="margin: 8px 0 0 0;"><strong>Referente:</strong> ${body.nomeReferente} ${body.cognomeReferente}</p>
                <p style="margin: 4px 0;"><strong>Email:</strong> ${body.email}</p>
                <p style="margin: 4px 0;"><strong>Telefono:</strong> ${body.telefono}</p>
                <p style="margin: 4px 0;"><strong>Indirizzo:</strong> ${body.indirizzo}, ${body.civico} - ${body.cap} ${body.citta}</p>
                ${body.website ? `<p style="margin: 4px 0;"><strong>Sito web:</strong> ${body.website}</p>` : ''}
              </div>
              ${body.nota ? `
              <div style="margin-top: 16px;">
                <p style="margin: 0;"><strong>Nota di presentazione:</strong></p>
                <p style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-top: 8px;">${body.nota}</p>
              </div>
              ` : ''}
              <div style="margin-top: 24px;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://kykos.it'}/admin/dashboard" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Gestisci in Dashboard</a>
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