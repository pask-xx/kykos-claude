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

export async function sendPasswordResetEmail(
  toEmail: string,
  resetUrl: string
): Promise<boolean> {
  const subject = 'Reimposta la tua password - KYKOS';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">KYKOS</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Reimposta la tua password</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Ciao! Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account KYKOS.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Clicca sul pulsante qui sotto per reimpostare la tua password. Il link sarà valido per <strong>1 ora</strong>.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Reimposta password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
            Se non hai richiesto tu questa reimpostazione, puoi ignorare questa email. La tua password rimarrà invariata.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0;">
            © 2024 KYKOS. Dona con dignità, ricevi con gratitudine.<br>
            Non rispondere a questa email.
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to: toEmail, subject, html });
}
