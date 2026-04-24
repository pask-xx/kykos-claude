import { Resend } from 'resend';

const FROM_EMAIL = 'KYKOS <noreply@kykos.it>';
const APP_NAME = 'KYKOS';
const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const LOGO_URL = `${APP_URL}/albero.svg`;

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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
          <img src="${LOGO_URL}" alt="KYKOS" style="height: 64px; margin-bottom: 16px;">
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Nuova richiesta!</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Ciao ${recipientName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Un ricevente ha fatto richiesta per il tuo oggetto.</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            <strong>Oggetto:</strong> ${objectTitle}</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${APP_URL}/donor/objects" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Vedi la richiesta
            </a>
          </div>
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

export async function sendObjectAvailableNotification(
  toEmail: string,
  recipientName: string,
  objectTitle: string,
  objectId: string
): Promise<boolean> {
  const subject = `${APP_NAME} - Il tuo oggetto è disponibile!`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px; text-align: center;">
          <img src="${LOGO_URL}" alt="KYKOS" style="height: 64px; margin-bottom: 16px;">
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Il tuo oggetto è disponibile!</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Ciao ${recipientName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Buone notizie! L'articolo che ti interessa è ora disponibile per il ritiro.</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            <strong>Oggetto:</strong> ${objectTitle}</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${APP_URL}/objects/${objectId}" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Richiedi ora
            </a>
          </div>
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

export async function sendQrCodeNotification(
  toEmail: string,
  recipientName: string,
  objectTitle: string,
  qrCodeData: string
): Promise<boolean> {
  const subject = `${APP_NAME} - QR Code per il ritiro`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 32px; text-align: center;">
          <img src="${LOGO_URL}" alt="KYKOS" style="height: 64px; margin-bottom: 16px;">
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">QR Code per il ritiro</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Ciao ${recipientName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Ecco il QR code per ritirare l'oggetto presso l'ente intermediario.</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            <strong>Oggetto:</strong> ${objectTitle}</p>
          <div style="margin: 24px 0; padding: 16px; background: #f9fafb; border-radius: 8px; text-align: center;">
            <p style="font-size: 12px; color: #666; margin: 0;">QR Code</p>
            <p style="font-family: monospace; font-size: 10px; margin: 8px 0 0 0; word-break: break-all;">${qrCodeData}</p>
          </div>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${APP_URL}/recipient/dashboard" style="display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Vai alla dashboard
            </a>
          </div>
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

export async function sendDonationConfirmedNotification(
  toEmail: string,
  donorName: string,
  recipientName: string,
  objectTitle: string
): Promise<boolean> {
  const subject = `${APP_NAME} - Donazione completata!`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); padding: 32px; text-align: center;">
          <img src="${LOGO_URL}" alt="KYKOS" style="height: 64px; margin-bottom: 16px;">
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Donazione completata!</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Ciao ${donorName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            La tua donazione è stata completata con successo.</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            <strong>Oggetto:</strong> ${objectTitle}</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            <strong>Ricevente:</strong> ${recipientName}</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Grazie per il tuo contributo!</p>
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

export async function sendPasswordResetEmail(
  toEmail: string,
  resetUrl: string
): Promise<boolean> {
  const subject = 'Reimposta la tua password - KYKOS';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px; text-align: center;">
          <img src="${LOGO_URL}" alt="KYKOS" style="height: 64px; margin-bottom: 16px;">
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Reimposta la tua password</p>
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
