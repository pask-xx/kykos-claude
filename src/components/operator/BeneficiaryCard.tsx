'use client';

import Link from 'next/link';
import { MapPin, ChevronRight } from 'lucide-react';
import { Avatar, Badge, Card } from '@/components/ui';

export interface BeneficiaryCardData {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  address: string | null;
  city: string | null;
  profileImageUrl: string | null;
}

export interface BeneficiaryCardProps {
  beneficiary: BeneficiaryCardData;
}

/**
 * <BeneficiaryCard> — card riusabile per la lista beneficiari street.
 *
 * Wrappata in `<Link>` per navigare al detail (dove si modifica).
 * La modifica si fa dal detail page, non dalla lista: rimuovere
 * il bottone "Modifica" inline evita la ridondanza e uniforma
 * il pattern con le altre card-lista del modulo.
 *
 * 0 useState (componente puro, riusato da page.tsx).
 *
 * Esempio:
 *   <BeneficiaryCard beneficiary={b} />
 */
export function BeneficiaryCard({ beneficiary }: BeneficiaryCardProps) {
  const fullName = `${beneficiary.firstName} ${beneficiary.lastName}`;
  const addressLine = [beneficiary.address, beneficiary.city].filter(Boolean).join(', ');

  return (
    <Link
      href={`/operator/street-beneficiaries/${beneficiary.id}`}
      className="block group"
    >
      <Card padding="none" className="hover:border-primary-300 transition-colors cursor-pointer">
        <div className="p-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={beneficiary.profileImageUrl}
              name={fullName}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{fullName}</h3>
              {addressLine && (
                <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{addressLine}</span>
                </p>
              )}
              {beneficiary.nickname && (
                <Badge variant="primary" size="sm" className="mt-1 font-mono">
                  @{beneficiary.nickname}
                </Badge>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors flex-shrink-0" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
