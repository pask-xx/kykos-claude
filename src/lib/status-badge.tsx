import type {
  RequestStatus,
  GoodsRequestStatus,
  GoodsOfferStatus,
  ObjectStatus,
} from '@/types';
import { Badge } from '@/components/ui';
import type { BadgeProps } from '@/components/ui/Badge';

/**
 * Status KYKOS unificato — unione dei 4 enum di stato del progetto.
 * Usato dal componente <StatusBadge> per type-safety sulla mappa
 * status → variant/label.
 *
 * Vedi docs/DESIGN.md §2.3 per la mappa canonica status → colore.
 */
export type KykosStatus =
  | RequestStatus
  | GoodsRequestStatus
  | GoodsOfferStatus
  | ObjectStatus;

/**
 * Dominio semantico dello status. Obbligatorio perché alcuni status
 * (es. "PENDING") esistono in 3+ enum con stesso significato, ma il
 * compiler TypeScript non può inferire il dominio da solo.
 */
export type StatusDomain = 'request' | 'goodsRequest' | 'goodsOffer' | 'object';

/**
 * Mappa type-safe status → variant Badge.
 * Coerente con docs/DESIGN.md §2.3, con 1 deviazione documentata:
 *   object.AVAILABLE → primary (NON success) per distinguerlo
 *   visivamente da object.DEPOSITED (anch'esso positivo).
 */
export const STATUS_BADGE_VARIANT: Record<KykosStatus, BadgeProps['variant']> = {
  // Request (richieste tradizionali)
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'default',
  CANCELLED: 'default',
  // GoodsRequest (richieste di bene da street operator)
  FULFILLED: 'info',
  DELIVERED: 'success',
  COMPLETED: 'default',
  // GoodsOffer (offerte su richieste)
  ACCEPTED: 'success',
  // Object (oggetti donati)
  AVAILABLE: 'primary',
  RESERVED: 'info',
  DEPOSITED: 'success',
  DONATED: 'default',
  BLOCKED: 'danger',
};

/**
 * Label italiana canonica per ogni status. Allineata a *_STATUS_LABELS
 * in src/types/index.ts e a docs/DESIGN.md §2.3.
 * Usata come fallback quando il consumer non passa una `label` esplicita.
 */
export const STATUS_BADGE_LABEL: Record<KykosStatus, string> = {
  // Request
  PENDING: 'In attesa',
  APPROVED: 'Approvata',
  REJECTED: 'Rifiutata',
  EXPIRED: 'Scaduta',
  CANCELLED: 'Cancellata',
  // GoodsRequest
  FULFILLED: 'Soddisfatta',
  DELIVERED: 'Depositata',
  COMPLETED: 'Completata',
  // GoodsOffer
  ACCEPTED: 'Accettata',
  // Object
  AVAILABLE: 'Disponibile',
  RESERVED: 'Riservata',
  DEPOSITED: 'Depositata',
  DONATED: 'Donata',
  BLOCKED: 'Bloccato',
};

export interface StatusBadgeProps {
  status: KykosStatus;
  domain: StatusDomain;
  /** Override label (es. label calcolata lato server). Se omessa, usa STATUS_BADGE_LABEL. */
  label?: string;
  className?: string;
}

/**
 * <StatusBadge> — wrapper su <Badge> con mappa type-safe status → variant+label.
 *
 * Centralizza la logica di rendering degli status, sostituendo le 18+
 * funzioni locali `getStatusBadge` / `getStatusVariant` sparse nel progetto.
 *
 * Esempi:
 *   <StatusBadge status="PENDING" domain="goodsOffer" />
 *   <StatusBadge status="AVAILABLE" domain="object" />
 *   <StatusBadge status={item.status as KykosStatus} domain="object" label={item.statusLabel} />
 */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const variant = STATUS_BADGE_VARIANT[status];
  const text = label ?? STATUS_BADGE_LABEL[status];
  return (
    <Badge variant={variant} className={className}>
      {text}
    </Badge>
  );
}
