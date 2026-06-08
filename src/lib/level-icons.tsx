import { Medal, Award, Trophy, Gem, type LucideIcon } from 'lucide-react';
import type { DonorLevel } from '@/types';
import { DONOR_LEVEL_LABELS } from '@/types';

/**
 * Mappa DonorLevel → icona lucide + classi colore (token semantici) + label italiana.
 *
 * Usata da:
 * - <ExpandableObjectCard> (card orizzontale in /recipient/dashboard, /recipient/objects, /recipient/my-objects)
 * - RecipientFeedClient (sezione oggetti regolari)
 *
 * Regole:
 * - Il livello è mostrato al RICEVENTE sugli oggetti ALTRUI (badge di "fiducia del donatore", vedi anonymity).
 * - NON è mostrato in my-objects (è una disponibilità propria, non serve badge di fiducia verso sé stessi).
 * - Label italiana: DONOR_LEVEL_LABELS (vedi src/types/index.ts).
 * - Colori: token semantici (warning per bronzo/oro, gray per argento, info per platino, secondary per diamante).
 *
 * Le label sono accessibili via sr-only nel consumer (il visual è solo l'icona).
 */
export interface LevelIconEntry {
  Icon: LucideIcon;
  className: string;
  label: string;
}

export const levelIconMap: Record<DonorLevel, LevelIconEntry> = {
  BRONZE: { Icon: Medal, className: 'w-4 h-4 text-warning-700', label: DONOR_LEVEL_LABELS.BRONZE },
  SILVER: { Icon: Medal, className: 'w-4 h-4 text-gray-500', label: DONOR_LEVEL_LABELS.SILVER },
  GOLD: { Icon: Award, className: 'w-4 h-4 text-warning-600', label: DONOR_LEVEL_LABELS.GOLD },
  PLATINUM: { Icon: Trophy, className: 'w-4 h-4 text-info-600', label: DONOR_LEVEL_LABELS.PLATINUM },
  DIAMOND: { Icon: Gem, className: 'w-4 h-4 text-secondary-600', label: DONOR_LEVEL_LABELS.DIAMOND },
};
