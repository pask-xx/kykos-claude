/**
 * Filtri riusabili per le `GoodsOffer` mostrate al donatore nelle dashboard.
 *
 * @see /donor/to-deliver/page.tsx (server component) per il pattern canonico
 *      con query Prisma che applica `request.status NOT IN [FULFILLED, DELIVERED, COMPLETED]`.
 *      Questo helper replica lo stesso predicato lato client per pagine client-side
 *      (/donor/requests, /donor/goods-requests).
 *
 * Bug originale: il donatore vedeva il bottone "Vedi QR Code per consegna"
 * per offerte ACCEPTED il cui `GoodsRequest` era già stato consegnato
 * dall'operatore (stato `DELIVERED` o `COMPLETED`). La scansione del QR
 * da parte dell'operatore restituiva 400 "QR code già utilizzato!".
 *
 * La transizione a `DELIVERED` è fatta SOLO dall'API canonica
 * `POST /api/operator/scan-qr-goods` (vedi `src/app/api/operator/scan-qr-goods/route.ts:143`).
 */

/**
 * Stati della `GoodsRequest` per i quali il donatore NON deve più
 * vedere il bottone QR per la consegna. Allineato al filtro server-side
 * in `/donor/to-deliver/page.tsx:41`.
 *
 * - FULFILLED: richiesta soddisfatta (l'ente ha già ricevuto, può marcare come consegnata)
 * - DELIVERED: richiesta consegnata all'ente (post-scansione operatore)
 * - COMPLETED: processo terminato (post-pickup beneficiario)
 * - CANCELLED: richiesta annullata (non più attiva)
 */
export const NON_DELIVERABLE_REQUEST_STATUSES = [
  'FULFILLED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
] as const;

export type NonDeliverableRequestStatus =
  (typeof NON_DELIVERABLE_REQUEST_STATUSES)[number];

/**
 * Stati della `GoodsRequest` per i quali il donatore PUÒ ancora vedere
 * il bottone QR per la consegna. È una whitelist esplicita (incluso `PENDING`
 * e `APPROVED`) per garantire safe-by-default: se uno status è invalido,
 * sconosciuto o non in questa lista, il bottone NON viene mostrato.
 */
export const DELIVERABLE_REQUEST_STATUSES = ['PENDING', 'APPROVED'] as const;

export type DeliverableRequestStatus =
  (typeof DELIVERABLE_REQUEST_STATUSES)[number];

/**
 * Shape minima richiesta da `isOfferDeliverable`. Accetta qualsiasi oggetto
 * che abbia `status` (offerta) e opzionalmente `request.status` (GoodsRequest).
 * Definito qui come structural type per evitare di importare il client Prisma
 * o un type globale che cambierebbe la signature.
 */
export interface GoodsOfferShape {
  status: string;
  request?: { status: string } | null;
}

/**
 * Predicato: l'offerta `GoodsOffer` è in stato tale per cui il donatore
 * può/deve ancora mostrare il bottone "QR Code per consegna"?
 *
 * Condizioni (in AND):
 * 1. `offer.status === 'ACCEPTED'` — l'ente ha accettato l'offerta.
 * 2. `offer.request.status` NON è in `NON_DELIVERABLE_REQUEST_STATUSES`
 *    — la richiesta non è ancora in stato terminale di consegna.
 *
 * Safe-by-default: ritorna `false` se dati mancanti o inconsistenti.
 *
 * @example
 * ```ts
 * const offers = await fetch('/api/donor/goods-offers').then(r => r.json());
 * const deliverable = offers.offers.filter(isOfferDeliverable);
 * ```
 */
export function isOfferDeliverable(offer: GoodsOfferShape): boolean {
  if (offer.status !== 'ACCEPTED') return false;
  if (!offer.request) return false;
  const requestStatus = offer.request.status as DeliverableRequestStatus;
  // Whitelist esplicita: se lo status è fuori dalla lista (incluso `undefined`,
  // typo runtime, o stato terminale tipo `DELIVERED`/`FULFILLED`/`COMPLETED`/
  // `CANCELLED`), il bottone NON viene mostrato. Safe-by-default.
  return DELIVERABLE_REQUEST_STATUSES.includes(requestStatus);
}