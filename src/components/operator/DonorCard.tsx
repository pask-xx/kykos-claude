'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Gift, Medal, Trophy, Gem, ChevronRight } from 'lucide-react';
import { Avatar, Badge, Card } from '@/components/ui';
import { DONOR_LEVEL_LABELS, type DonorLevel } from '@/types';
import { formatDate } from '@/lib/utils';

export interface DonorCardData {
  id: string;
  nickname: string | null;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  canProvideServices: boolean;
  canProvideServicesAt: string | null;
  createdAt: string;
  profileImageUrl: string | null;
  donorProfile: {
    totalDonations: number;
    level: string;
  } | null;
}

export interface DonorCardProps {
  donor: DonorCardData;
  /**
   * href di destinazione al click sulla card. Default: /operator/donors/{id}.
   * Wrappata in <Link> per navigare al detail (dove si gestisce).
   * Tutte le azioni (messaggio, modifica, revoca) si fanno dal detail page,
   * non dalla lista: rimuovere il bottone "Dettagli" inline evita
   * disallineamenti e uniforma il pattern con BeneficiaryCard.
   */
  href?: string;
}

interface LevelVisual {
  Icon: LucideIcon;
  /** Classi tailwind per il background del badge (yellow-500 per GOLD, ecc.). */
  bg: string;
  text: string;
  border: string;
}

/**
 * Mappa DonorLevel → visual (icona + colori).
 * I colori "metallo" (oro, argento, bronzo) NON mappano sui token semantici
 * del design system (warning/success): sono identità visive riconoscibili.
 * Per questo sono l'unica eccezione consentita ai token semantici nelle
 * primitive KYKOS.
 */
const LEVEL_VISUALS: Record<DonorLevel, LevelVisual> = {
  BRONZE:   { Icon: Medal,  bg: 'bg-amber-700',   text: 'text-amber-50',  border: 'border-amber-800' },
  SILVER:   { Icon: Medal,  bg: 'bg-gray-400',    text: 'text-gray-50',   border: 'border-gray-500' },
  GOLD:     { Icon: Medal,  bg: 'bg-yellow-500',  text: 'text-yellow-50', border: 'border-yellow-600' },
  PLATINUM: { Icon: Trophy, bg: 'bg-gray-600',    text: 'text-gray-50',   border: 'border-gray-700' },
  DIAMOND:  { Icon: Gem,    bg: 'bg-sky-400',     text: 'text-sky-50',    border: 'border-sky-500' },
};

/**
 * <DonorCard> — card riusabile per la lista donatori dell'operatore.
 *
 * Wrappata in <Link> per navigare al detail (dove si gestisce).
 * Card full-width, padding uniforme, hover su border primary.
 *
 * Contenuto:
 * - Avatar 48px + nome (nickname o fallback firstName+lastName) + email
 * - Riga meta: badge livello donatore, conteggio donazioni, badge "Servizi"
 *   (visibile SOLO se canProvideServices=true; se false, non mostriamo
 *   nessun badge "Solo beni" — è il default implicito, non merita un'etichetta)
 * - Data registrazione in fondo
 *
 * 0 useState (componente puro).
 *
 * Esempio:
 *   <DonorCard donor={d} />
 */
export function DonorCard({ donor, href }: DonorCardProps) {
  const linkHref = href ?? `/operator/donors/${donor.id}`;

  // Display name: nickname (se presente) → firstName+lastName → name
  const realName = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
  const displayName = donor.nickname || realName || donor.name;

  const levelKey = (donor.donorProfile?.level as DonorLevel) || 'BRONZE';
  const visual = LEVEL_VISUALS[levelKey] ?? LEVEL_VISUALS.BRONZE;
  const levelLabel = DONOR_LEVEL_LABELS[levelKey] ?? levelKey;
  const totalDonations = donor.donorProfile?.totalDonations ?? 0;

  return (
    <Link href={linkHref} className="block group">
      <Card padding="none" className="hover:border-primary-300 transition-colors cursor-pointer">
        <div className="p-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={donor.profileImageUrl}
              name={displayName || '?'}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {displayName || 'Senza nome'}
              </h3>
              <p className="text-sm text-gray-500 truncate">{donor.email}</p>
            </div>

            {/* Chevron mobile come affordance (desktop = hover border + cursor) */}
            <ChevronRight
              className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors flex-shrink-0 md:hidden"
              aria-hidden="true"
            />
          </div>

          {/* Riga meta: livello + donazioni + servizi */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border ${visual.bg} ${visual.text} ${visual.border}`}
              aria-label={`Livello donatore: ${levelLabel}`}
            >
              <visual.Icon className="w-3 h-3" aria-hidden="true" />
              {levelLabel}
            </span>
            <span className="text-sm text-gray-500">
              {totalDonations} {totalDonations === 1 ? 'donazione' : 'donazioni'}
            </span>
            {donor.canProvideServices && (
              <Badge variant="success">Servizi</Badge>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-2">
            Registrato il {formatDate(donor.createdAt)}
          </p>
        </div>
      </Card>
    </Link>
  );
}
