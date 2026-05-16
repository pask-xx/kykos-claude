'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

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

const TYPE_COLORS: Record<string, { border: string; badge: string; label: string }> = {
  GOODS: { border: 'border-l-blue-500', badge: 'bg-blue-100 text-blue-700', label: 'Bene' },
  SERVICES: { border: 'border-l-purple-500', badge: 'bg-purple-100 text-purple-700', label: 'Servizio' },
  AVAILABLE: { border: 'border-l-green-500', badge: 'bg-green-100 text-green-700', label: 'Disponibilita' },
};

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
        const aPendingOffers = aOffers.filter((o: any) => o.status === 'PENDING').length;
        const bPendingOffers = bOffers.filter((o: any) => o.status === 'PENDING').length;

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
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (item: UnifiedItem) => {
    if (item.itemType === 'AVAILABLE') {
      const labels: Record<string, { label: string; color: string }> = {
        AVAILABLE: { label: 'Disponibile', color: 'bg-green-100 text-green-700' },
        RESERVED: { label: 'Riservata', color: 'bg-amber-100 text-amber-700' },
        DEPOSITED: { label: 'Depositata', color: 'bg-blue-100 text-blue-700' },
        DONATED: { label: 'Ritirato', color: 'bg-gray-100 text-gray-700' },
        CANCELLED: { label: 'Cancellato', color: 'bg-red-100 text-red-700' },
      };
      const s = labels[item.object.status] || { label: item.object.status, color: 'bg-gray-100 text-gray-700' };
      return <span className={`px-2 py-1 text-xs rounded whitespace-nowrap ${s.color}`}>{s.label}</span>;
    }

    const labels: Record<string, { label: string; color: string }> = {
      PENDING: { label: 'In attesa', color: 'bg-amber-100 text-amber-700' },
      APPROVED: { label: 'Approvata', color: 'bg-green-100 text-green-700' },
      FULFILLED: { label: 'Soddisfatta', color: 'bg-blue-100 text-blue-700' },
      DELIVERED: { label: 'Depositata', color: 'bg-blue-100 text-blue-700' },
      COMPLETED: { label: 'Completata', color: 'bg-gray-100 text-gray-700' },
      CANCELLED: { label: 'Cancellata', color: 'bg-red-100 text-red-700' },
    };
    const s = labels[item.status] || { label: item.status, color: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2 py-1 text-xs rounded whitespace-nowrap ${s.color}`}>{s.label}</span>;
  };

  const getPendingOffersCount = (item: UnifiedItem): number => {
    if (item.itemType === 'AVAILABLE') return 0;
    const offers = (item as EntityRequest).offers || [];
    return offers.filter((o: any) => o.status === 'PENDING').length;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      FURNITURE: '🪑', ELECTRONICS: '📱', CLOTHING: '👕', BOOKS: '📚',
      KITCHEN: '🍳', SPORTS: '⚽', TOYS: '🧸', OTHER: '📦',
    };
    return icons[category] || '📦';
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
              <h1 className="text-2xl sm:text-3xl font-medium text-gray-900">Le tue richieste</h1>
              <p className="text-sm sm:text-base text-gray-500">Beni, servizi e oggetti richiesti</p>
            </div>
            <Link
              href="/recipient/requests-entity/requests/new"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-center"
            >
              + Nuova richiesta
            </Link>
          </div>

          <div className="flex gap-3 sm:gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-gray-600">Beni</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              <span className="text-gray-600">Servizi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-gray-600">Disponibilita</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Caricamento...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 sm:p-12 text-center">
              <span className="text-4xl sm:text-5xl mb-4 block">📋</span>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Nessuna richiesta</h2>
              <p className="text-gray-500">Non hai ancora richiesto beni, servizi o oggetti.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {items.map((item) => {
                const colors = TYPE_COLORS[item.itemType];
                const image = getImage(item);
                const pendingOffers = getPendingOffersCount(item);

                return (
                  <Link
                    key={`${item.itemType}-${item.id}`}
                    href={item.link}
                    className={`block bg-white p-2 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-primary-300 transition border-l-4 ${colors.border} overflow-hidden`}
                  >
                    <div className="flex gap-2 sm:gap-4">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {image ? (
                          <img src={image} alt={getTitle(item)} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-base sm:text-xl">
                            {item.itemType === 'AVAILABLE' ? '📦' : getCategoryIcon((item as EntityRequest).category)}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h3 className="font-semibold text-gray-900 text-xs sm:text-sm truncate leading-tight">{getTitle(item)}</h3>

                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          {pendingOffers > 0 && (
                            <span className="text-xs px-1 py-0.5 rounded bg-orange-100 text-orange-700 whitespace-nowrap">
                              {pendingOffers} 📬
                            </span>
                          )}
                          {getStatusBadge(item)}
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