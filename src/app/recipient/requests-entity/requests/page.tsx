'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Plus, ClipboardList, Mail } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { Badge, Button, EmptyState, Spinner } from '@/components/ui';

interface EntityRequest {
  id: string;
  title: string;
  category: string;
  description: string | null;
  type: string;
  status: string;
  createdAt: string;
  beneficiary: { id: string; name: string };
  intermediary: { id: string; name: string };
  fulfilledBy: { id: string; name: string } | null;
  offers: Array<{
    id: string;
    message: string | null;
    status: string;
    createdAt: string;
    offeredBy: { id: string; name: string };
  }>;
}

interface ObjectRequest {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  object: {
    id: string;
    title: string;
    category: string;
    condition: string;
    imageUrls: string[];
    status: string;
    depositLocation: string | null;
  };
  donation: { id: string; amount: string; createdAt: string } | null;
}

type UnifiedItem =
  | (EntityRequest & { itemType: 'GOODS' | 'SERVICES'; link: string })
  | (ObjectRequest & { itemType: 'AVAILABLE'; link: string });

const STATUS_PRIORITY: Record<string, number> = {
  DEPOSITED: 100,
  RESERVED: 70,
  AVAILABLE: 60,
  DONATED: 20,
  CANCELLED: 10,
  DELIVERED: 100,
  FULFILLED: 70,
  PENDING: 80,
  APPROVED: 50,
  COMPLETED: 20,
};

/**
 * Mappa Object.status → Badge variant KYKOS.
 * vedi: src/types/ObjectStatus.
 */
function objectStatusBadge(status: string) {
  switch (status) {
    case 'AVAILABLE': return { variant: 'success' as const, label: 'Disponibile' };
    case 'RESERVED': return { variant: 'warning' as const, label: 'Riservata' };
    case 'DEPOSITED': return { variant: 'primary' as const, label: 'Depositata' };
    case 'DONATED': return { variant: 'default' as const, label: 'Ritirato' };
    case 'CANCELLED': return { variant: 'danger' as const, label: 'Cancellato' };
    default: return { variant: 'default' as const, label: status };
  }
}

/**
 * Mappa EntityRequest.status → Badge variant KYKOS.
 * vedi: src/types/EntityRequestStatus.
 */
function entityRequestStatusBadge(status: string) {
  switch (status) {
    case 'PENDING': return { variant: 'warning' as const, label: 'In attesa' };
    case 'APPROVED': return { variant: 'success' as const, label: 'Approvata' };
    case 'FULFILLED': return { variant: 'info' as const, label: 'Soddisfatta' };
    case 'DELIVERED': return { variant: 'primary' as const, label: 'Depositata' };
    case 'COMPLETED': return { variant: 'default' as const, label: 'Completata' };
    case 'CANCELLED': return { variant: 'danger' as const, label: 'Cancellata' };
    default: return { variant: 'default' as const, label: status };
  }
}

/**
 * Mappa itemType → Badge variant + colore bordo card.
 * vedi: docs/DESIGN.md §2.3 mappa status.
 */
function itemTypeBadge(itemType: UnifiedItem['itemType']) {
  switch (itemType) {
    case 'GOODS': return { variant: 'info' as const, label: 'Bene', borderClass: 'border-l-info-500' };
    case 'SERVICES': return { variant: 'primary' as const, label: 'Servizio', borderClass: 'border-l-primary-500' };
    case 'AVAILABLE': return { variant: 'success' as const, label: 'Disponibilità', borderClass: 'border-l-success-500' };
  }
}

export default function RecipientEntityRequestsPage() {
  const [items, setItems] = useState<UnifiedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [goodsRes, servicesRes, availableRes] = await Promise.all([
        fetch('/api/entity-requests?filter=mine&type=GOODS'),
        fetch('/api/entity-requests?filter=mine&type=SERVICES'),
        fetch('/api/recipient/requests'),
      ]);

      const goodsData = goodsRes.ok ? await goodsRes.json() : { requests: [] };
      const servicesData = servicesRes.ok ? await servicesRes.json() : { requests: [] };
      const availableData = availableRes.ok ? await availableRes.json() : { requests: [] };

      const unified: UnifiedItem[] = [
        ...(goodsData.requests || []).map((r: EntityRequest) => ({
          ...r,
          itemType: 'GOODS' as const,
          link: `/recipient/requests-entity/requests/${r.id}`,
        })),
        ...(servicesData.requests || []).map((r: EntityRequest) => ({
          ...r,
          itemType: 'SERVICES' as const,
          link: `/recipient/requests-entity/requests/${r.id}`,
        })),
        ...((availableData.requests || []) as ObjectRequest[]).map((r: ObjectRequest) => ({
          ...r,
          itemType: 'AVAILABLE' as const,
          link: `/recipient/objects/${r.object.id}`,
        })),
      ];

      unified.sort((a, b) => {
        const aOffers = (a as EntityRequest).offers || [];
        const bOffers = (b as EntityRequest).offers || [];
        const aPendingOffers = aOffers.filter((o) => o.status === 'PENDING').length;
        const bPendingOffers = bOffers.filter((o) => o.status === 'PENDING').length;

        const aStatus = a.itemType === 'AVAILABLE' ? a.object.status : a.status;
        const bStatus = b.itemType === 'AVAILABLE' ? b.object.status : b.status;
        let aPriority = STATUS_PRIORITY[aStatus] ?? 0;
        let bPriority = STATUS_PRIORITY[bStatus] ?? 0;

        if (aPendingOffers > 0) aPriority += 15;
        if (bPendingOffers > 0) bPriority += 15;

        if (aPriority !== bPriority) return bPriority - aPriority;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setItems(unified);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const getPendingOffersCount = (item: UnifiedItem): number => {
    if (item.itemType === 'AVAILABLE') return 0;
    const offers = (item as EntityRequest).offers || [];
    return offers.filter((o) => o.status === 'PENDING').length;
  };

  const getTitle = (item: UnifiedItem) => {
    if (item.itemType === 'AVAILABLE') return item.object.title;
    return (item as EntityRequest).title;
  };

  const getImage = (item: UnifiedItem) => {
    if (item.itemType === 'AVAILABLE') return item.object.imageUrls?.[0] || null;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Le tue richieste</h1>
              <p className="text-gray-500">Beni, servizi e oggetti richiesti</p>
            </div>
            <Link href="/recipient/requests-entity/requests/new">
              <Button variant="primary">
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                Nuova richiesta
              </Button>
            </Link>
          </div>

          <div className="flex gap-3 sm:gap-4 text-sm flex-wrap">
            <Badge variant="info">Beni</Badge>
            <Badge variant="primary">Servizi</Badge>
            <Badge variant="success">Disponibilità</Badge>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nessuna richiesta"
              description="Non hai ancora richiesto beni, servizi o oggetti."
            />
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {items.map((item) => {
                const typeStyle = itemTypeBadge(item.itemType);
                const image = getImage(item);
                const pendingOffers = getPendingOffersCount(item);
                const statusBadge = item.itemType === 'AVAILABLE'
                  ? objectStatusBadge(item.object.status)
                  : entityRequestStatusBadge(item.status);

                return (
                  <Link
                    key={`${item.itemType}-${item.id}`}
                    href={item.link}
                    className={`block bg-white p-2 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-primary-300 transition border-l-4 ${typeStyle.borderClass} overflow-hidden`}
                  >
                    <div className="flex gap-2 sm:gap-4">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {image ? (
                          <img src={image} alt={getTitle(item)} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="h-5 w-5 sm:h-7 sm:w-7 text-gray-400" aria-hidden="true" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h3 className="font-semibold text-gray-900 text-xs sm:text-sm truncate leading-tight">{getTitle(item)}</h3>

                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          {pendingOffers > 0 && (
                            <Badge variant="warning" size="sm">
                              <Mail className="h-3 w-3 mr-0.5 inline" aria-hidden="true" />
                              {pendingOffers}
                            </Badge>
                          )}
                          <Badge variant={statusBadge.variant} size="sm">
                            {statusBadge.label}
                          </Badge>
                        </div>

                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
