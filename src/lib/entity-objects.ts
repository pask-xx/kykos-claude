import { generateAndUploadQrCodeWithLogo, generatePickupQrCode } from '@/lib/qrcode';
import { sendPickupQrNotification } from '@/lib/email';
import type { LocationHours } from '@/types';

/**
 * Oggetti pubblicati dall'ente (l'ente è il donatore).
 *
 * Un oggetto "pubblicato dall'ente" è un pezzo fisico già giacente nel
 * deposito dell'ente che l'ente rende disponibile ai propri beneficiari.
 * Non c'è un donatore utente: l'ente stesso è il donatore.
 *
 * Come viene rappresentato nel DB:
 * - `Object.donorId` RESTA obbligatorio e punta all'account dell'ente
 *   (`Organization.userId`, utente con `role = INTERMEDIARY`). L'ente è
 *   quindi letteralmente il donatore e `Donation.donorId` non va toccato.
 * - `Object.publishedByOrgId` è il MARCATORE che distingue questa
 *   disponibilità da una normale donazione di un utente. È nullable:
 *   NULL = oggetto di un utente (comportamento identico a oggi).
 *
 * Perché non rendere nullable `Object.donorId`: renderebbe nullable ogni
 * `include: { donor: ... }` in ~25 file, costringendo a un TS narrowing
 * ovunque (con il rischio concreto di regressioni su anonymity e su pagine
 * pubbliche). Il marcatore esplicito mantiene `donorId` non-null e rende
 * la distinzione queryabile e leggibile.
 */

/** Sottoinsieme di `Object` necessario al predicato. */
export interface EntityPublishedLike {
  /** `Object.publishedByOrgId` — NULL se l'oggetto è di un donatore utente. */
  publishedByOrgId?: string | null;
}

/**
 * `true` se l'oggetto è una disponibilità pubblicata dall'ente.
 *
 * Predicato canonico dell'intero codebase: usare questo invece di
 * confrontare `donorId` con `Organization.userId` (che funzionerebbe, ma
 * non è queryabile né esplicito).
 */
export function isEntityPublished(obj: EntityPublishedLike | null | undefined): boolean {
  return Boolean(obj?.publishedByOrgId);
}

/**
 * Stato `Object` al momento dell'approvazione della richiesta.
 *
 * - Donatore utente: `RESERVED` (l'oggetto deve ancora essere consegnato).
 * - Ente: `DEPOSITED` (l'oggetto è già in giacenza in sede, non c'è una
 *   gamba di consegna da fare).
 */
export const OBJECT_STATUS_ON_APPROVAL = {
  DONOR: 'RESERVED',
  ENTITY: 'DEPOSITED',
} as const;

/**
 * Dati ente necessari per le email al beneficiario.
 * (Sottoinsieme di `Organization` — i campi sono tutti opzionali.)
 */
export interface EntityOrgInfo {
  name: string;
  address?: string | null;
  houseNumber?: string | null;
  cap?: string | null;
  city?: string | null;
  province?: string | null;
  phone?: string | null;
  email?: string | null;
  hoursInfo?: string | null;
  hours?: LocationHours | null;
  notes?: string | null;
}

/**
 * Invia al beneficiario il QR di ritiro di una disponibilità dell'ente.
 *
 * È il punto di innesto del flusso "l'ente è il donatore": non esiste un
 * donatore da avvisare e non viene generato alcun QR di consegna. Il
 * beneficiario riceve direttamente il QR di ritiro, che mostra in sede
 * all'operatore (ramo `pickup` di `/api/operator/scan-qr`, invariato).
 *
 * Best-effort: un errore di generazione/invio non deve far fallire
 * l'approvazione (che è già stata committata nel DB).
 */
export async function sendEntityPickupQrNotification(params: {
  requestId: string;
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  objectTitle: string;
  objectId: string;
  org: EntityOrgInfo;
}): Promise<boolean> {
  const { requestId, recipientId, recipientEmail, recipientName, objectTitle, objectId, org } = params;

  const qrData = generatePickupQrCode(requestId, recipientId, 'object');
  const qrImageUrl = await generateAndUploadQrCodeWithLogo(qrData, `pickup-${requestId}.png`);

  return sendPickupQrNotification(
    recipientEmail,
    recipientId,
    recipientName,
    objectTitle,
    objectId,
    qrData,
    qrImageUrl,
    org.name,
    org.address ?? null,
    org.houseNumber ?? null,
    org.cap ?? null,
    org.city ?? null,
    org.province ?? null,
    org.phone ?? null,
    org.email ?? null,
    org.hoursInfo ?? null,
    org.hours ?? null,
    org.notes ?? null
  );
}
