'use client';

import { Badge } from '@/components/ui';
import { entityObjectStatusMeta } from '@/lib/entity-object-rules';
import type { ObjectStatus } from '@/types';

/**
 * Badge di stato delle disponibilità dell'ente.
 *
 * Le label sono contestuali ("In giacenza" invece di "Depositata",
 * "Revocata" invece di "Cancellato"): vedi `entityObjectStatusMeta`.
 */
export function EntityObjectStatusBadge({ status }: { status: ObjectStatus }) {
  const { variant, label } = entityObjectStatusMeta(status);
  return (
    <Badge variant={variant} pill>
      {label}
    </Badge>
  );
}
