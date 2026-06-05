/**
 * qrcode-client — funzioni QR client-safe.
 *
 * Estratte da `lib/qrcode.ts` per evitare di trascinare `sharp` (Node-only)
 * e il client Supabase service-role nel bundle del browser.
 *
 * Usato da pagine/stampanti client (es. operator/print-label).
 * Le funzioni server-side (con logo, upload Supabase) restano in `qrcode.ts`.
 */

import QRCode from 'qrcode';

/**
 * Genera un data URL PNG (300×300, margin 2) per il QR code del contenuto dato.
 * Colori KYKOS: verde primary (#059669) su bianco.
 */
export async function generateQrCodeDataUrl(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: {
      dark: '#059669',
      light: '#ffffff',
    },
  });
}
