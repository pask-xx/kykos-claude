'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { CATEGORY_LABELS } from '@/types';

interface DepositedObject {
  id: string;
  title: string;
  category: string;
  status: string;
  imageUrls: string[];
  createdAt: string;
  depositLocation: string | null;
  donor: { id: string; name: string };
  recipient: { id: string; name: string };
}

interface DepositedGood {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
  depositLocation: string | null;
  beneficiary: { id: string; name: string };
  fulfilledBy: { id: string; name: string };
}

type DepositedItem = (DepositedObject | DepositedGood) & { type: 'object' | 'good' };

const GOODS_STATUS_LABELS: Record<string, string> = {
  PENDING: 'In attesa',
  APPROVED: 'Approvata',
  FULFILLED: 'Offerto',
  DELIVERED: 'Consegnato',
  COMPLETED: 'Completata',
  CANCELLED: 'Cancellata',
};

export default function DepositPage() {
  const [items, setItems] = useState<DepositedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    fetchDepositedItems();
  }, []);

  const fetchDepositedItems = async () => {
    try {
      const [objectsRes, goodsRes] = await Promise.all([
        fetch('/api/operator/objects'),
        fetch('/api/operator/requests-entity'),
      ]);

      const objectsData = objectsRes.ok ? await objectsRes.json() : { objects: [] };
      const goodsData = goodsRes.ok ? await goodsRes.json() : { requests: [] };

      // Filter DEPOSITED objects
      const depositedObjects: DepositedObject[] = (objectsData.objects || [])
        .filter((o: any) => o.status === 'DEPOSITED')
        .map((o: any) => ({
          id: o.id,
          title: o.title,
          category: o.category,
          status: o.status,
          imageUrls: o.imageUrls || [],
          createdAt: o.createdAt,
          depositLocation: o.depositLocation || null,
          donor: o.donor || { id: '', name: 'Donatore' },
          recipient: o.recipient || { id: '', name: 'Beneficiario' },
        }));

      // Filter DELIVERED goods requests
      const depositedGoods: DepositedGood[] = (goodsData.requests || [])
        .filter((r: any) => r.status === 'DELIVERED')
        .map((r: any) => ({
          id: r.id,
          title: r.title,
          category: r.category,
          status: r.status,
          createdAt: r.createdAt,
          depositLocation: r.depositLocation || null,
          beneficiary: r.beneficiary || { id: '', name: 'Beneficiario' },
          fulfilledBy: r.fulfilledBy || { id: '', name: 'Donatore' },
        }));

      // Combine and sort by createdAt desc
      const allItems: DepositedItem[] = [
        ...depositedObjects.map(o => ({ ...o, type: 'object' as const })),
        ...depositedGoods.map(g => ({ ...g, type: 'good' as const })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setItems(allItems);
    } catch (err) {
      console.error('Error fetching deposited items:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [...new Set(items.map(i => i.category))];

  const filteredItems = items.filter(item => {
    const matchesSearch = !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.type === 'object'
        ? (item as DepositedObject).donor.name.toLowerCase().includes(search.toLowerCase())
        : (item as DepositedGood).beneficiary.name.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = !filterCategory || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getItemLink = (item: DepositedItem) => {
    if (item.type === 'object') {
      return `/operator/objects/${item.id}`;
    }
    return `/operator/goods-pickup/${item.id}`;
  };

  const getImage = (item: DepositedItem) => {
    if (item.type === 'object') {
      const obj = item as DepositedObject;
      if (obj.imageUrls && obj.imageUrls.length > 0) {
        return obj.imageUrls[0];
      }
    }
    return null;
  };

  const getDonorName = (item: DepositedItem) => {
    if (item.type === 'object') {
      return (item as DepositedObject).donor.name;
    }
    return (item as DepositedGood).fulfilledBy.name;
  };

  const getBeneficiaryName = (item: DepositedItem) => {
    if (item.type === 'object') {
      return (item as DepositedObject).recipient.name;
    }
    return (item as DepositedGood).beneficiary.name;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">In deposito</h1>
          <p className="text-gray-500">{filteredItems.length} elementi</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per titolo, donatore o beneficiario..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="min-w-[140px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        >
          <option value="">Tutte le tipologie</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat}
            </option>
          ))}
        </select>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
          <span className="text-5xl mb-4 block">📦</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessun elemento</h2>
          <p className="text-gray-500">
            {search || filterCategory
              ? 'Nessun elemento corrisponde ai filtri.'
              : 'Non ci sono elementi in deposito.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredItems.map((item) => {
              const image = getImage(item);
              return (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={getItemLink(item)}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Image or placeholder */}
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {image ? (
                        <img src={image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{item.type === 'object' ? '📦' : '🎁'}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                          <p className="text-sm text-gray-500">
                            {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] || item.category}
                          </p>
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0">
                          {formatDate(item.createdAt)}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <span className="text-gray-400">Donatore:</span>
                          <span className="font-medium">{getDonorName(item)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <span className="text-gray-400">Beneficiario:</span>
                          <span className="font-medium">{getBeneficiaryName(item)}</span>
                        </div>
                        {item.depositLocation && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <span className="text-gray-400">Posizione:</span>
                            <span className="font-medium">{item.depositLocation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}