import { fileTypeFromBuffer } from 'file-type';

/**
 * A7 — Validazione magic bytes per upload.
 *
 * Le route di upload (`/api/upload`, `/api/profile-photo`, `/api/volunteer/upload-cv`)
 * si sono sempre fidate di `file.type` dichiarato dal client. Questo è bypassabile:
 * un client malevolo può dichiarare `image/jpeg` come Content-Type e inviare un
 * payload arbitrario (eseguibile, script, web shell).
 *
 * Soluzione: leggere i **magic bytes** del buffer (i primi byte del file) e
 * confrontarli con un'allowlist lato server. I magic bytes non sono falsificabili
 * senza corrompere il file.
 *
 * Usare SEMPRE `validation.detectedMime` per il Content-Type dell'upload
 * e `validation.detectedExt` per l'estensione del path, MAI `file.type` o
 * `file.name.split('.').pop()`.
 */

export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const ALLOWED_DOCUMENT_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

/**
 * CV accetta sia documenti Office/PDF sia immagini (per cv scansionati).
 */
export const ALLOWED_CV_MIMES = [
  ...ALLOWED_DOCUMENT_MIMES,
  ...ALLOWED_IMAGE_MIMES,
] as const;

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIMES)[number];
export type AllowedDocumentMime = (typeof ALLOWED_DOCUMENT_MIMES)[number];
export type AllowedCvMime = (typeof ALLOWED_CV_MIMES)[number];

export type FileValidationResult =
  | { valid: true; detectedMime: string; detectedExt: string }
  | { valid: false; reason: string };

/**
 * Verifica che il file abbia magic bytes coerenti con uno dei MIME consentiti.
 * Usa `file-type`: rileva il MIME reale dai primi byte e lo confronta con l'allowlist.
 *
 * MAI fidarsi del Content-Type dichiarato dal client.
 */
export async function validateFileMagicBytes(
  buffer: Buffer,
  allowedMimes: readonly string[]
): Promise<FileValidationResult> {
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected) {
    return { valid: false, reason: 'Tipo di file non riconoscibile' };
  }
  if (!allowedMimes.includes(detected.mime)) {
    return {
      valid: false,
      reason: `Tipo file non consentito (rilevato: ${detected.mime})`,
    };
  }
  return {
    valid: true,
    detectedMime: detected.mime,
    detectedExt: detected.ext,
  };
}
