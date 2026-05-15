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

const ACTIVE_STATUSES = ['PENDING', 'APPROVED', 'FULFILLED', 'RESERVED', 'DEPOSITED'];
const CLOSED_STATUSES = ['COMPLETED', 'DONATED', 'CANCELLED'];

const TYPE_COLORS: Record<string, { border: string; badge: string; label: string }> = {
  GOODS: { border: 'border-l-blue-500', badge: 'bg-blue-100 text-blue-700', label: 'Bene' },
  SERVICES: { border: 'border-l-purple-500', badge: 'bg-purple-100 text-purple-700', label: 'Servizio' },
  AVAILABLE: { border: 'border-l-green-500', badge: 'bg-green-100 text-green-700', label: 'Disponibilità' },
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

      // Sort: active first, closed last
      unified.sort((a, b) => {
        const aActive = ACTIVE_STATUSES.includes(a.status) ||
          (a.itemType === 'AVAILABLE' ? ACTIVE_STATUSES.includes(a.object.status) : false);
        const bActive = ACTIVE_STATUSES.includes(b.status) ||
          (b.itemType === 'AVAILABLE' ? ACTIVE_STATUSES.includes(b.object.status) : false);
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
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
        RESERVED: { label: 'In attesa', color: 'bg-amber-100 text-amber-700' },
        DEPOSITED: { label: 'Pronto', color: 'bg-blue-100 text-blue-700' },
        DONATED: { label: 'Ritirato', color: 'bg-gray-100 text-gray-700' },
        CANCELLED: { label: 'Cancellato', color: 'bg-red-100 text-red-700' },
      };
      const s = labels[item.object.status] || { label: item.object.status, color: 'bg-gray-100 text-gray-700' };
      return <span className={`px-2 py-1 text-xs rounded ${s.color}`}>{s.label}</span>;
    }

    const labels: Record<string, { label: string; color: string }> = {
      PENDING: { label: 'In attesa', color: 'bg-amber-100 text-amber-700' },
      APPROVED: { label: 'Approvata', color: 'bg-green-100 text-green-700' },
      FULFILLED: { label: 'Soddisfatta', color: 'bg-blue-100 text-blue-700' },
      COMPLETED: { label: 'Completata', color: 'bg-gray-100 text-gray-700' },
      CANCELLED: { label: 'Cancellata', color: 'bg-red-100 text-red-700' },
    };
    const s = labels[item.status] || { label: item.status, color: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2 py-1 text-xs rounded ${s.color}`}>{s.label}</span>;
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

  const getCreatedAt = (item: UnifiedItem) => {
    return item.createdAt;
  };

  const getImage = (item: UnifiedItem) => {
    if (item.itemType === 'AVAILABLE') {
      return item.object.imageUrls?.[0] || null;
    }
    return null;
  };

  const getDepositLocation = (item: UnifiedItem) => {
    if (item.itemType === 'AVAILABLE') return item.object.depositLocation;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium text-gray-900">Le tue richieste</h1>
          <p className="text-gray-500">Beni, servizi e oggetti richiesti</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm">
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
          <span className="text-gray-600">Disponibilità</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Caricamento...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <span className="text-5xl mb-4 block">📋</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessuna richiesta</h2>
          <p className="text-gray-500">Non hai ancora richiesto beni, servizi o oggetti.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => {
            const colors = TYPE_COLORS[item.itemType];
            const image = getImage(item);
            const depositLocation = getDepositLocation(item);

            return (
              <Link
                key={`${item.itemType}-${item.id}`}
                href={item.link}
                className={`bg-white p-4 rounded-xl shadow-sm border-2 border-gray-100 hover:border-primary-200 transition border-l-4 ${colors.border}`}
              >
                <div className="flex gap-4">
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {image ? (
                      <img src={image} alt={getTitle(item)} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">
                        {item.itemType === 'AVAILABLE' ? '📦' : getCategoryIcon(item.itemType === 'GOODS' ? (item as EntityRequest).category : (item as EntityRequest).category)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{getTitle(item)}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded ${colors.badge}`}>
                            {colors.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Richiesta il {formatDate(getCreatedAt(item))}
                        </p>
                      </div>
                      {getStatusBadge(item)}
                    </div>
                    {depositLocation && (
                      <p className="text-xs text-gray-400 mt-1">📍 {depositLocation}</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}