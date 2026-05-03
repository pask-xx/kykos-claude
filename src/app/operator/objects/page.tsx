'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/types';

interface Object {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  status: string;
  imageUrls: string[];
  createdAt: string;
  donor: { name: string };
}

export default function OperatorObjectsPage() {
  const [objects, setObjects] = useState<Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showDonated, setShowDonated] = useState(false);

  useEffect(() => {
    fetchObjects();
  }, []);

  const fetchObjects = async () => {
    try {
      const res = await fetch('/api/operator/objects');
      const data = await res.json();
      setObjects(data.objects || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredObjects = objects.filter(obj => {
    const matchesSearch = obj.title.toLowerCase().includes(search.toLowerCase()) ||
      (obj.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesCategory = !filterCategory || obj.category === filterCategory;
    if (obj.status === 'DONATED' && !showDonated) return false;
    const matchesStatus = !filterStatus || obj.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Disponibile</span>;
      case 'RESERVED':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">Riservato</span>;
      case 'DONATED':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Donato</span>;
      case 'DEPOSITED':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Depositato</span>;
      case 'CANCELLED':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Cancellato</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{status}</span>;
    }
  };

  const categories = [...new Set(objects.map(o => o.category))];
  const statuses = [...new Set(objects.map(o => o.status))].filter(s => s !== 'DONATED');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione disponibilità</h1>
          <p className="text-gray-500">{filteredObjects.length} oggetti</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showDonated}
            onChange={(e) => setShowDonated(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          Mostra donati
        </label>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col gap-4">
        <input
          type="text"
          placeholder="Cerca per titolo o descrizione..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex-1 min-w-[140px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="">Tutte</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 min-w-[140px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="">Tutti gli stati</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Caricamento...</p>
        </div>
      ) : filteredObjects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
          <span className="text-5xl mb-4 block">📦</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessun oggetto</h2>
          <p className="text-gray-500">Non ci sono oggetti che corrispondono ai filtri.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredObjects.map((obj) => (
            <div
              key={obj.id}
              className="bg-white p-4 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition"
              onClick={() => window.location.href = `/operator/objects/${obj.id}`}
            >
              <div className="flex gap-3">
                {/* Image */}
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {obj.imageUrls && obj.imageUrls.length > 0 ? (
                    <img src={obj.imageUrls[0]} alt={obj.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{obj.title}</h3>
                    {getStatusBadge(obj.status)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {CATEGORY_LABELS[obj.category as keyof typeof CATEGORY_LABELS] || obj.category}
                    <span className="text-gray-400 ml-1">
                      ({CONDITION_LABELS[obj.condition as keyof typeof CONDITION_LABELS] || obj.condition})
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(obj.createdAt)}</p>
                </div>
              </div>

              {/* Action for DEPOSITED */}
              {obj.status === 'DEPOSITED' && (
                <div
                  className="mt-3 pt-3 border-t border-gray-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    href={`/operator/objects/${obj.id}/deliver`}
                    className="inline-block px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded-lg hover:bg-green-200 font-medium"
                  >
                    📦 Conferma consegna
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}