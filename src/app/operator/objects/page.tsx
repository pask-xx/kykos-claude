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
    // By default, hide DONATED objects unless "showDonated" is checked
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
      case 'WITHDRAWN':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Ritirato</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{status}</span>;
    }
  };

  const categories = [...new Set(objects.map(o => o.category))];
  const statuses = [...new Set(objects.map(o => o.status))].filter(s => s !== 'DONATED');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
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
      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Cerca per titolo o descrizione..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        >
          <option value="">Tutte le categorie</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        >
          <option value="">Tutti gli stati</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
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
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titolo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredObjects.map((obj) => (
                <tr key={obj.id} className="hover:bg-gray-50 cursor-pointer transition" onClick={() => window.location.href = `/operator/objects/${obj.id}`}>
                  <td className="px-4 py-3">
                    <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {obj.imageUrls && obj.imageUrls.length > 0 ? (
                        <img src={obj.imageUrls[0]} alt={obj.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">📦</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{obj.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{obj.description || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {CATEGORY_LABELS[obj.category as keyof typeof CATEGORY_LABELS] || obj.category}
                    <span className="text-gray-400 ml-1">
                      ({CONDITION_LABELS[obj.condition as keyof typeof CONDITION_LABELS] || obj.condition})
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div onClick={(e) => e.stopPropagation()}>
                      {getStatusBadge(obj.status)}
                      {obj.status === 'WITHDRAWN' && (
                        <Link
                          href={`/operator/objects/${obj.id}/deliver`}
                          className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 inline-block"
                        >
                          Conferma consegna
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(obj.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
