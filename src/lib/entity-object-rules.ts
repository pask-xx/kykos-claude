import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  OBJECT_STATUS_LABELS,
  type Category,
  type Condition,
  type ObjectStatus,
} from '@/types';

/**
 * Regole pure sulle disponibilità pubblicate dall'ente (l'ente è il donatore).
 *
 * MODULO PURO: nessun import server-only. Usato dalle route API (Node),
 * dalle pagine client e dai componenti condivisi.
 *
 * Le regole di revoca/ripubblicazione/modifica sono definite UNA volta sola
 * e usate sia dalla UI (per mostrare o nascondere i bottoni) sia dalle API
 * (per validare): la UI non può mai autorizzare un'azione che il server
 * rifiuta.
 */

/** Limite foto: allineato a `MAX_IMAGES` del form donatore. */
export const MAX_ENTITY_IMAGES = 5;

/**
 * Stati in cui una disponibilità dell'ente può ancora essere revocata.
 *
 * - `AVAILABLE`: appena pubblicata, nessun ritiro in corso.
 * - `DEPOSITED`: in giacenza in attesa di ritiro (per l'ente l'oggetto è
 *   già in sede: non esiste una gamba di consegna da fare).
 *
 * `DONATED` (consegnato) e `CANCELLED` (già revocata) sono esclusi.
 */
export const ENTITY_REVOCABLE_STATUSES = ['AVAILABLE', 'DEPOSITED'] as const;

/** Stati in cui la pubblicazione può essere modificata (titolo, foto, ...). */
export const ENTITY_EDITABLE_STATUSES = ['AVAILABLE', 'DEPOSITED'] as const;

/** Stato in cui una disponibilità revocata può essere ripubblicata. */
export const ENTITY_REPUBLISHABLE_STATUSES = ['CANCELLED'] as const;

export type EntityBadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

/**
 * `true` se la disponibilità può essere revocata adesso.
 *
 * Condizioni (entrambe necessarie):
 * - stato tra `ENTITY_REVOCABLE_STATUSES`;
 * - nessuna richiesta attiva (PENDING/APPROVED) sull'oggetto.
 *
 * Safe-by-default: se il numero di richieste non è un valore numerico
 * finito la revoca viene negata (non sappiamo, non agiamo).
 */
export function canRevokeEntityObject(
  status: ObjectStatus | string,
  activeRequests: number
): boolean {
  const revocable = (ENTITY_REVOCABLE_STATUSES as readonly string[]).includes(status);
  if (!revocable) return false;
  return Number.isFinite(activeRequests) && activeRequests <= 0;
}

/** `true` se la pubblicazione può essere modificata (non ancora consegnata). */
export function canEditEntityObject(status: ObjectStatus | string): boolean {
  return (ENTITY_EDITABLE_STATUSES as readonly string[]).includes(status);
}

/** `true` se la disponibilità revocata può essere ripubblicata. */
export function canRepublishEntityObject(status: ObjectStatus | string): boolean {
  return (ENTITY_REPUBLISHABLE_STATUSES as readonly string[]).includes(status);
}

/** Campi accettati dalla creazione/modifica di una disponibilità. */
export interface EntityObjectInput {
  title?: unknown;
  category?: unknown;
  condition?: unknown;
  imageUrls?: unknown;
}

const CATEGORY_VALUES = Object.keys(CATEGORY_LABELS) as Category[];
const CONDITION_VALUES = Object.keys(CONDITION_LABELS) as Condition[];

export function isEntityCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORY_VALUES as string[]).includes(value);
}

export function isEntityCondition(value: unknown): value is Condition {
  return typeof value === 'string' && (CONDITION_VALUES as string[]).includes(value);
}

/**
 * Valida i campi di una disponibilità (creazione o modifica).
 * Restituisce `null` se tutto va bene, altrimenti il messaggio d'errore
 * (già tradotto, pronto per la UI).
 */
export function validateEntityObjectInput(input: EntityObjectInput): string | null {
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title) {
    return 'Il titolo è obbligatorio';
  }

  if (!isEntityCategory(input.category)) {
    return 'Categoria non valida';
  }

  if (!isEntityCondition(input.condition)) {
    return 'Condizione non valida';
  }

  if (!Array.isArray(input.imageUrls) || input.imageUrls.length === 0) {
    return 'Almeno una foto è obbligatoria';
  }

  if (input.imageUrls.length > MAX_ENTITY_IMAGES) {
    return `Massimo ${MAX_ENTITY_IMAGES} foto`;
  }

  if (!input.imageUrls.every((url) => typeof url === 'string' && url.trim().length > 0)) {
    return 'Le foto devono essere immagini valide';
  }

  return null;
}

/**
 * Label e variante del badge per il contesto "ente".
 *
 * Nel magazzino "DEPOSITED" non significa "depositato da un donatore" ma
 * "in giacenza in sede, in attesa che il beneficiario ritiri"; "CANCELLED"
 * è una revoca dell'ente, non una cancellazione generica.
 */
export function entityObjectStatusMeta(status: ObjectStatus | string): {
  variant: EntityBadgeVariant;
  label: string;
} {
  switch (status) {
    case 'AVAILABLE':
      return { variant: 'success', label: OBJECT_STATUS_LABELS.AVAILABLE };
    case 'RESERVED':
      return { variant: 'info', label: OBJECT_STATUS_LABELS.RESERVED };
    case 'DEPOSITED':
      return { variant: 'warning', label: 'In giacenza' };
    case 'DONATED':
      return { variant: 'default', label: OBJECT_STATUS_LABELS.DONATED };
    case 'CANCELLED':
      return { variant: 'danger', label: 'Revocata' };
    case 'BLOCKED':
      return { variant: 'danger', label: OBJECT_STATUS_LABELS.BLOCKED };
    default:
      // Stato fuori dall'enum: non si mostra mai il valore grezzo.
      return { variant: 'default', label: 'Sconosciuto' };
  }
}
