'use client';

import Link from 'next/link';
import { MapPin, ChevronRight } from 'lucide-react';
import { Avatar, Badge, Card } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export interface BeneficiaryCardData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  address: string | null;
  city: string | null;
  profileImageUrl: string | null;
}

export interface BeneficiaryCardProps {
  beneficiary: BeneficiaryCardData;
  /**
   * true = beneficiario gestito da street operator (senza account proprio).
   * Mostra `firstName + lastName` come titolo, email nascosta (è fittizia).
   * false = beneficiario classico con account: mostra SOLO il nickname
   * (regola anonimato KYKOS: il nome reale è visibile solo all'operatore
   * che lo gestisce tramite il detail).
   */
  isStreetManaged?: boolean;
  /**
   * href di destinazione al click sulla card. Default: lista street.
   * Sovrascrivibile per riuso nella pagina /operator/recipients (lista office).
   */
  href?: string;
  /**
   * Email reale del beneficiario (solo classici, NON street).
   * Se passata, viene mostrata come riga secondaria sotto il nome.
   */
  email?: string | null;
  /**
   * Score di bisogno 0-100 (Recipient Need Score).
   * Se passato, la card mostra:
   * - Mobile: progress bar orizzontale colorata in fondo alla card
   * - Desktop: cerchio SVG 56×56 speculare all'avatar
   * Coerente con la mappa status→colore di `NeedScoreGauge`:
   * 80+ error, 50+ warning, 20+ info, <20 gray.
   */
  score?: number | null;
  /**
   * Data di autorizzazione (ISO string o Date).
   * Se passata insieme a `score`, viene mostrata nella stessa riga
   * (mobile: 50% sx, desktop: sotto il nome come "Autorizzato il 29 apr 2026").
   */
  authorizedAt?: string | null;
}

interface ScoreLevel {
  threshold: number;
  bg: string;     // classe per progress bar (bg-error-500, ecc.)
  stroke: string; // classe SVG stroke
  text: string;   // classe per testo del valore
}

const SCORE_LEVELS: ScoreLevel[] = [
  { threshold: 80, bg: 'bg-error-500', stroke: 'stroke-error-500', text: 'text-error-600' },
  { threshold: 50, bg: 'bg-warning-500', stroke: 'stroke-warning-500', text: 'text-warning-600' },
  { threshold: 20, bg: 'bg-info-500', stroke: 'stroke-info-500', text: 'text-info-600' },
  { threshold: 0, bg: 'bg-gray-400', stroke: 'stroke-gray-400', text: 'text-gray-500' },
];

function getScoreLevel(score: number): ScoreLevel {
  for (const level of SCORE_LEVELS) {
    if (score >= level.threshold) return level;
  }
  return SCORE_LEVELS[SCORE_LEVELS.length - 1];
}

/**
 * <BeneficiaryCard> — card riusabile per la lista beneficiari (street + office).
 *
 * Wrappata in `<Link>` per navigare al detail (dove si gestisce).
 * Tutte le azioni (Modifica, Autorizza, Revoca) si fanno dal detail page,
 * non dalla lista: rimuovere i bottoni inline evita disallineamenti e
 * uniforma il pattern con le altre card-lista del modulo.
 *
 * Display name policy:
 * - isStreetManaged=true  → `firstName + lastName` (identità reale)
 * - isStreetManaged=false → solo `nickname` (identità fittizia, anonimato KYKOS)
 *
 * Email policy:
 * - isStreetManaged=true  → mai mostrata (è fittizia, generata a sistema)
 * - isStreetManaged=false → mostrata se passata (è reale, dato operatore↔ricevente)
 *
 * Score display (se passato):
 * - Mobile: progress bar orizzontale colorata in fondo alla card
 * - Desktop (md+): cerchio SVG 56×56 speculare all'avatar
 *
 * 0 useState (componente puro, riusato da 2 page.tsx).
 *
 * Esempio:
 *   <BeneficiaryCard beneficiary={b} href={`/operator/recipients/${b.id}`}
 *     isStreetManaged={b.isStreetManaged} email={b.email}
 *     score={b.needScore} authorizedAt={b.authorizedAt} />
 */
export function BeneficiaryCard({
  beneficiary,
  isStreetManaged = false,
  href,
  email,
  score,
  authorizedAt,
}: BeneficiaryCardProps) {
  const fullName = [beneficiary.firstName, beneficiary.lastName].filter(Boolean).join(' ');
  const addressLine = [beneficiary.address, beneficiary.city].filter(Boolean).join(', ');

  // Display name: street → nome reale, classico → solo nickname
  const displayName = isStreetManaged ? fullName : (beneficiary.nickname || fullName);

  // href di default per la lista street
  const linkHref = href ?? `/operator/street-beneficiaries/${beneficiary.id}`;

  const hasScore = score != null;
  const hasAuthorizedAt = !!authorizedAt;
  const showMetaRow = hasScore || hasAuthorizedAt;
  const scoreLevel = hasScore ? getScoreLevel(score) : null;
  const scoreClamped = hasScore ? Math.max(0, Math.min(100, score)) : 0;

  return (
    <Link
      href={linkHref}
      className="block group"
    >
      <Card padding="none" className="hover:border-primary-300 transition-colors cursor-pointer">
        <div className="p-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={beneficiary.profileImageUrl}
              name={displayName || '?'}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {displayName || 'Senza nome'}
              </h3>
              {addressLine && (
                <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">{addressLine}</span>
                </p>
              )}
              {/* Email SOLO per beneficiari classici (street ha email fittizia) */}
              {!isStreetManaged && email && (
                <p className="text-sm text-gray-500 truncate">{email}</p>
              )}
              {/* Nickname come badge SOLO per street (classici mostrano SOLO nickname come titolo) */}
              {isStreetManaged && beneficiary.nickname && (
                <Badge variant="primary" size="sm" className="mt-1 font-mono">
                  @{beneficiary.nickname}
                </Badge>
              )}
              {/* Desktop: data autorizzazione sotto il nome */}
              {hasAuthorizedAt && (
                <p className="text-xs text-gray-400 mt-1 hidden md:block">
                  Autorizzato il {formatDate(authorizedAt!)}
                </p>
              )}
            </div>

            {/* Desktop: cerchio score 56×56 speculare all'avatar */}
            {hasScore && scoreLevel && (
              <div className="relative w-14 h-14 flex-shrink-0 hidden md:block" aria-label={`Score di bisogno: ${scoreClamped} su 100`}>
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="14" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    className={scoreLevel.stroke}
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={`${(scoreClamped / 100) * 264} 264`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-sm font-bold ${scoreLevel.text}`}>
                    {scoreClamped}
                  </span>
                </div>
              </div>
            )}

            {/* Mobile: chevron come affordance (rimosso su desktop dove c'è il cerchio) */}
            <ChevronRight
              className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors flex-shrink-0 md:hidden"
              aria-hidden="true"
            />
          </div>

          {/* Mobile: riga meta (score 50% sx SEMPRE, data 50% dx se presente) */}
          {showMetaRow && (
            <div className="mt-3 flex items-center gap-3 md:hidden">
              {hasScore && scoreLevel && (
                <div
                  className="w-1/2 h-2 bg-gray-200 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={scoreClamped}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Score di bisogno: ${scoreClamped} su 100`}
                >
                  <div
                    className={`h-full rounded-full ${scoreLevel.bg} transition-all`}
                    style={{ width: `${scoreClamped}%` }}
                  />
                </div>
              )}
              {hasAuthorizedAt && (
                <span className="text-xs text-gray-500 w-1/2 truncate text-right">
                  {formatDate(authorizedAt!)}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
