'use client';

import Link from 'next/link';
import { MapPin, ChevronRight } from 'lucide-react';
import { Avatar, Badge, Card } from '@/components/ui';

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
 * 0 useState (componente puro, riusato da 2 page.tsx).
 *
 * Esempio:
 *   <BeneficiaryCard beneficiary={b} href={`/operator/recipients/${b.id}`} isStreetManaged={b.isStreetManaged} email={b.email} />
 */
export function BeneficiaryCard({ beneficiary, isStreetManaged = false, href, email }: BeneficiaryCardProps) {
  const fullName = [beneficiary.firstName, beneficiary.lastName].filter(Boolean).join(' ');
  const addressLine = [beneficiary.address, beneficiary.city].filter(Boolean).join(', ');

  // Display name: street → nome reale, classico → solo nickname
  const displayName = isStreetManaged ? fullName : (beneficiary.nickname || fullName);

  // href di default per la lista street
  const linkHref = href ?? `/operator/street-beneficiaries/${beneficiary.id}`;

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
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors flex-shrink-0" aria-hidden="true" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
