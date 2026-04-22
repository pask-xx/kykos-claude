import { Resend } from 'resend';

const FROM_EMAIL = 'KYKOS <noreply@kykos.it>';
const APP_NAME = 'KYKOS';
const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    console.log('Email sent:', data?.id);
    return true;
  } catch (err) {
    console.error('Email send failed:', err);
    return false;
  }
}

// Email templates

export async function sendRequestNotification(
  toEmail: string,
  recipientName: string,
  objectTitle: string,
  objectId: string
): Promise<boolean> {
  const subject = `${APP_NAME} - Qualcuno ha richiesto un tuo oggetto`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Nuova richiesta per "${objectTitle}"</h2>
      <p>Ciao ${recipientName},</p>
      <p>Un ricevente ha fatto richiesta per il tuo oggetto.</p>
      <p><strong>Oggetto:</strong> ${objectTitle}</p>
      <a href="${APP_URL}/donor/objects" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
        Vedi la richiesta
      </a>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
      <p style="color: #666; font-size: 14px;">
        ${APP_NAME} - Dona con dignità, ricevi con gratitudine
      </p>
    </div>
  `;

  return sendEmail({ to: toEmail, subject, html });
}

export async function sendObjectAvailableNotification(
  toEmail: string,
  recipientName: string,
  objectTitle: string,
  objectId: string
): Promise<boolean> {
  const subject = `${APP_NAME} - Il tuo oggetto è disponibile!`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">L'oggetto "${objectTitle}" è pronto!</h2>
      <p>Ciao ${recipientName},</p>
      <p>Buone notizie! L'articolo che ti interessa è ora disponibile per il ritiro.</p>
      <p><strong>Oggetto:</strong> ${objectTitle}</p>
      <a href="${APP_URL}/objects/${objectId}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
        Richiedi ora
      </a>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
      <p style="color: #666; font-size: 14px;">
        ${APP_NAME} - Dona con dignità, ricevi con gratitudine
      </p>
    </div>
  `;

  return sendEmail({ to: toEmail, subject, html });
}

export async function sendQrCodeNotification(
  toEmail: string,
  recipientName: string,
  objectTitle: string,
  qrCodeData: string
): Promise<boolean> {
  const subject = `${APP_NAME} - QR Code per il ritiro`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">QR Code per "${objectTitle}"</h2>
      <p>Ciao ${recipientName},</p>
      <p>Ecco il QR code per ritirare l'oggetto presso l'ente intermediario.</p>
      <p><strong>Oggetto:</strong> ${objectTitle}</p>
      <div style="margin: 24px 0; padding: 16px; background: #f9fafb; border-radius: 8px;">
        <p style="font-size: 12px; color: #666; margin: 0;">QR Code</p>
        <p style="font-family: monospace; font-size: 10px; margin: 8px 0 0 0; word-break: break-all;">${qrCodeData}</p>
      </div>
      <a href="${APP_URL}/recipient/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
        Vai alla dashboard
      </a>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
      <p style="color: #666; font-size: 14px;">
        ${APP_NAME} - Dona con dignità, ricevi con gratitudine
      </p>
    </div>
  `;

  return sendEmail({ to: toEmail, subject, html });
}

export async function sendDonationConfirmedNotification(
  toEmail: string,
  donorName: string,
  recipientName: string,
  objectTitle: string
): Promise<boolean> {
  const subject = `${APP_NAME} - Donazione completata!`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Donazione completata!</h2>
      <p>Ciao ${donorName},</p>
      <p>La tua donazione è stata completata con successo.</p>
      <p><strong>Oggetto:</strong> ${objectTitle}</p>
      <p><strong>Ricevente:</strong> ${recipientName}</p>
      <p>Grazie per il tuo contributo!</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
      <p style="color: #666; font-size: 14px;">
        ${APP_NAME} - Dona con dignità, ricevi con gratitudine
      </p>
    </div>
  `;

  return sendEmail({ to: toEmail, subject, html });
}
