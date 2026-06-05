'use client';

import Link from 'next/link';
import { MapPin, ChevronRight } from 'lucide-react';
import { Avatar, Badge, Button, Card } from '@/components/ui';

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
  onEdit: (id: string) => void;
}

/**
 * <BeneficiaryCard> — card riusabile per la lista beneficiari street.
 *
 * Pattern: la card è wrappata in `<Link>` per navigare al detail.
 * Il bottone "Modifica" ha `e.preventDefault()` + `e.stopPropagation()`
 * per NON triggerare la navigazione (apre il form in lista).
 *
 * 0 useState (componente puro, riusato da page.tsx).
 *
 * Esempio:
 *   <BeneficiaryCard
 *     beneficiary={b}
 *     onEdit={(id) => { setEditingId(id); setShowForm(true); }}
 *   />
 */
export function BeneficiaryCard({ beneficiary, onEdit }: BeneficiaryCardProps) {
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
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(beneficiary.id);
                }}
              >
                Modifica
              </Button>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
