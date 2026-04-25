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
            Un beneficiario ha fatto richiesta per la tua disponibilità.</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            <strong>Disponibilità:</strong> ${objectTitle}</p>
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
            <strong>Disponibilità:</strong> ${objectTitle}</p>
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
  qrCodeData: string,
  qrCodeImageUrl: string
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
            <strong>Disponibilità:</strong> ${objectTitle}</p>
          <div style="margin: 24px 0; padding: 16px; background: #f9fafb; border-radius: 8px; text-align: center;">
            <p style="font-size: 12px; color: #666; margin: 0 0 12px;">QR Code</p>
            <img src="${qrCodeImageUrl}" alt="QR Code" style="width: 200px; height: 200px;" />
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

export async function sendDeliveryQrNotification(
  toEmail: string,
  donorName: string,
  objectTitle: string,
  qrCodeData: string,
  qrCodeImageUrl: string,
  organizationName: string,
  organizationAddress: string | null,
  organizationHouseNumber: string | null,
  organizationCap: string | null,
  organizationCity: string | null,
  organizationProvince: string | null,
  organizationPhone: string | null,
  organizationEmail: string | null,
  hoursInfo?: string | null
): Promise<boolean> {
  const subject = `${APP_NAME} - QR Code per la consegna`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
          <img src="${LOGO_URL}" alt="KYKOS" style="height: 64px; margin-bottom: 16px;">
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">QR Code per la consegna</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Ciao ${donorName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Ecco il QR code per consegnare la tua donazione presso l&apos;ente intermediario.</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            <strong>Disponibilità:</strong> ${objectTitle}</p>
          <div style="margin: 24px 0; padding: 16px; background: #f9fafb; border-radius: 8px; text-align: center;">
            <p style="font-size: 12px; color: #666; margin: 0 0 12px;">QR Code - Consegna</p>
            <img src="${qrCodeImageUrl}" alt="QR Code" style="width: 200px; height: 200px;" />
            <p style="font-family: monospace; font-size: 10px; margin: 8px 0 0 0; word-break: break-all;">${qrCodeData}</p>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Recati presso l&apos;ente con la tua donazione per completare la consegna.</p>
          ${(organizationName || organizationAddress || organizationHouseNumber || organizationCap || organizationCity || organizationProvince || organizationPhone || organizationEmail) ? `<div style="margin: 24px 0; padding: 16px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #059669;">
            <p style="font-size: 14px; color: #059669; font-weight: 600; margin: 0 0 8px;">📍 Dettagli ente</p>
            ${organizationName ? `<p style="font-size: 14px; color: #374151; font-weight: 600; margin: 0 0 4px;">${organizationName}</p>` : ''}
            ${organizationAddress ? `<p style="font-size: 14px; color: #6b7280; margin: 0 0 4px;">${organizationAddress}${organizationHouseNumber ? `, ${organizationHouseNumber}` : ''}${organizationCap || organizationCity ? `<br>${[organizationCap, organizationCity].filter(Boolean).join(' ')}${organizationProvince ? ` (${organizationProvince})` : ''}` : ''}</p>` : ''}
            ${organizationPhone ? `<p style="font-size: 14px; color: #6b7280; margin: 0 0 4px;">📞 ${organizationPhone}</p>` : ''}
            ${organizationEmail ? `<p style="font-size: 14px; color: #6b7280; margin: 0;">✉️ ${organizationEmail}</p>` : ''}
          </div>` : ''}
          ${hoursInfo ? `<div style="margin: 24px 0; padding: 16px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #2563eb;">
            <p style="font-size: 14px; color: #1e40af; font-weight: 600; margin: 0 0 8px;">🕐 Orari e informazioni</p>
            <div style="color: #374151; font-size: 14px; line-height: 1.6;">${hoursInfo}</div>
          </div>` : ''}
          <div style="text-align: center; margin: 32px 0;">
            <a href="${APP_URL}/donor/dashboard" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
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

export async function sendPickupQrNotification(
  toEmail: string,
  recipientName: string,
  objectTitle: string,
  qrCodeData: string,
  qrCodeImageUrl: string,
  hoursInfo?: string | null
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
            Ecco il QR code per ritirare l&apos;oggetto presso l&apos;ente intermediario.</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            <strong>Disponibilità:</strong> ${objectTitle}</p>
          <div style="margin: 24px 0; padding: 16px; background: #f9fafb; border-radius: 8px; text-align: center;">
            <p style="font-size: 12px; color: #666; margin: 0 0 12px;">QR Code - Ritiro</p>
            <img src="${qrCodeImageUrl}" alt="QR Code" style="width: 200px; height: 200px;" />
            <p style="font-family: monospace; font-size: 10px; margin: 8px 0 0 0; word-break: break-all;">${qrCodeData}</p>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Recati presso l&apos;ente intermediario per procedere con il ritiro.</p>
          ${hoursInfo ? `<div style="margin: 24px 0; padding: 16px; background: #faf5ff; border-radius: 8px; border-left: 4px solid #7c3aed;">
            <p style="font-size: 14px; color: #6d28d9; font-weight: 600; margin: 0 0 8px;">🕐 Orari e informazioni</p>
            <div style="color: #374151; font-size: 14px; line-height: 1.6;">${hoursInfo}</div>
          </div>` : ''}
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

export async function sendObjectReadyForPickupNotification(
  toEmail: string,
  recipientName: string,
  objectTitle: string,
  objectId: string
): Promise<boolean> {
  const subject = `${APP_NAME} - Il tuo oggetto e' pronto per il ritiro!`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px; text-align: center;">
          <img src="${LOGO_URL}" alt="KYKOS" style="height: 64px; margin-bottom: 16px;">
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Oggetto pronto per il ritiro!</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Ciao ${recipientName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Buone notizie! L'oggetto che hai richiesto e' pronto per essere ritirato.</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            <strong>Disponibilità:</strong> ${objectTitle}</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Recati presso l'ente intermediario per procedere con il ritiro.</p>
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
            La tua donazione è stata completata con successo. L'ente ha confermato che l'oggetto è stato consegnato a un beneficiario.</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            <strong>Disponibilità:</strong> ${objectTitle}</p>
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

export async function sendWelcomeEmail(
  toEmail: string,
  userName: string,
  role: 'DONOR' | 'RECIPIENT' | 'INTERMEDIARY'
): Promise<boolean> {
  const roleLabels: Record<string, { title: string; subtitle: string; description: string }> = {
    DONOR: {
      title: 'Benvenuto, Donatore!',
      subtitle: 'I tuoi oggetti possono fare la differenza',
      description: 'Con KYKOS puoi donare oggetti che non usi più a persone che ne hanno davvero bisogno. La donazione è anonima e gestita tramite enti fidati.',
    },
    RECIPIENT: {
      title: 'Benvenuto in KYKOS!',
      subtitle: 'Siamo qui per aiutarti',
      description: 'Attraverso KYKOS puoi richiedere oggetti donati da persone generose. Il tuo ente di riferimento ti supporterà in ogni passaggio.',
    },
    INTERMEDIARY: {
      title: 'Benvenuto, Ente!',
      subtitle: 'Il ponte tra donatori e riceventi',
      description: 'KYKOS ti permette di coordinare le donazioni nella tua comunità, verificando i riceventi e gestendo lo scambio in sicurezza.',
    },
  };

  const roleData = roleLabels[role] || roleLabels.DONOR;

  const subject = roleData.title;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 32px; text-align: center;">
          <img src="${LOGO_URL}" alt="KYKOS" style="height: 72px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${roleData.title}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0; font-size: 16px;">${roleData.subtitle}</p>
        </div>

        <!-- Content -->
        <div style="padding: 32px;">
          <!-- Greeting -->
          <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">
            Ciao <strong>${userName}</strong>, benvenuto in KYKOS! Siamo felici di averti con noi.
          </p>

          <!-- Role Description -->
          <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
            <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0;">
              ${roleData.description}
            </p>
          </div>

          <!-- Manifesto -->
          <h2 style="color: #059669; font-size: 20px; margin: 0 0 20px; display: flex; align-items: center; gap: 8px;">
            <span>📜</span> Il Manifesto KYKOS
          </h2>

          <div style="display: grid; gap: 16px;">
            <!-- Principle 1 -->
            <div style="display: flex; gap: 16px; align-items: flex-start;">
              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #059669, #047857); border-radius: 8px; display: table; flex-shrink: 0;">
                <div style="display: table-cell; vertical-align: middle; text-align: center; line-height: 40px;">
                  <span style="font-size: 18px;">🔒</span>
                </div>
              </div>
              <div>
                <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 4px;">Anonimato totale</h3>
                <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.6;">Chi dona non sa chi riceve. Chi riceve non sa chi dona. La dignità è preservata attraverso l'anonimato reciproco.</p>
              </div>
            </div>

            <!-- Principle 2 -->
            <div style="display: flex; gap: 16px; align-items: flex-start;">
              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #059669, #047857); border-radius: 8px; display: table; flex-shrink: 0;">
                <div style="display: table-cell; vertical-align: middle; text-align: center; line-height: 40px;">
                  <span style="font-size: 18px;">🏢</span>
                </div>
              </div>
              <div>
                <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 4px;">Enti fidati</h3>
                <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.6;">Caritas, parrocchie e associazioni verificano i riceventi e coordinano lo scambio in sicurezza.</p>
              </div>
            </div>

            <!-- Principle 3 -->
            <div style="display: flex; gap: 16px; align-items: flex-start;">
              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #059669, #047857); border-radius: 8px; display: table; flex-shrink: 0;">
                <div style="display: table-cell; vertical-align: middle; text-align: center; line-height: 40px;">
                  <span style="font-size: 18px;">🌱</span>
                </div>
              </div>
              <div>
                <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 4px;">Sostenibilità</h3>
                <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.6;">Dai nuova vita alle cose che non usi più. Ogni donazione contribuisce a un mondo più sostenibile.</p>
              </div>
            </div>

            <!-- Principle 4 -->
            <div style="display: flex; gap: 16px; align-items: flex-start;">
              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #059669, #047857); border-radius: 8px; display: table; flex-shrink: 0;">
                <div style="display: table-cell; vertical-align: middle; text-align: center; line-height: 40px;">
                  <span style="font-size: 18px;">💚</span>
                </div>
              </div>
              <div>
                <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 4px;">Comunità</h3>
                <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.6;">KYKOS costruisce ponti nella comunità, creando relazioni di fiducia e solidarietà tra persone.</p>
              </div>
            </div>
          </div>

          <!-- Quote -->
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); padding: 24px; border-radius: 12px; margin: 32px 0; text-align: center;">
            <p style="color: #059669; font-size: 18px; font-style: italic; margin: 0; line-height: 1.6;">
              "Dona con dignità, ricevi con gratitudine"
            </p>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${APP_URL}" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 600; font-size: 16px;">
              Inizia ora →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
            © 2024 KYKOS. Dona con dignità, ricevi con gratitudine.<br>
            <a href="${APP_URL}/manifesto" style="color: #059669; text-decoration: none;">Leggi il manifesto completo</a>
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
