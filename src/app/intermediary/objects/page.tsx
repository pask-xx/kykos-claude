'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { CATEGORY_LABELS } from '@/types';
import Link from 'next/link';

interface Object {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  status: string;
  imageUrls: string[] | null;
  createdAt: string;
  donor: { name: string; firstName: string | null; lastName: string | null };
  _count: { requests: number };
}

export default function IntermediaryObjectsPage() {
  const [objects, setObjects] = useState<Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchObjects();
  }, []);

  const fetchObjects = async () => {
    try {
      const res = await fetch('/api/intermediary/objects');
      const data = await res.json();
      setObjects(data.objects || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

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
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{status}</span>;
    }
  };

  const filteredObjects = objects.filter(obj => {
    const matchesSearch = !search ||
      obj.title.toLowerCase().includes(search.toLowerCase()) ||
      obj.donor.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || obj.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="max-w-full">
      <h1 className="text-3xl font-medium text-gray-900 mb-2">Disponibilità</h1>
      <p className="text-gray-500 mb-6">Gestisci le disponibilità presenti nel tuo ente</p>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Cerca per titolo o donatore..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        >
          <option value="ALL">Tutti gli stati</option>
          <option value="AVAILABLE">Disponibile</option>
          <option value="RESERVED">Riservato</option>
          <option value="DONATED">Donato</option>
          <option value="DEPOSITED">Depositato</option>
        </select>
      </div>

      {objects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <span className="text-5xl mb-4 block">📦</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessuna disponibilità</h2>
          <p className="text-gray-500">Non ci sono disponibilità nel tuo ente.</p>
        </div>
      ) : filteredObjects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <span className="text-5xl mb-4 block">🔍</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessun risultato</h2>
          <p className="text-gray-500">Nessuna disponibilità trovata per "{search}"</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredObjects.map((obj) => (
            <div key={obj.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {obj.imageUrls && obj.imageUrls[0] ? (
                  <img src={obj.imageUrls[0]} alt={obj.title} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-5xl">📦</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {CATEGORY_LABELS[obj.category as keyof typeof CATEGORY_LABELS] || obj.category}
                  </span>
                  {getStatusBadge(obj.status)}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 truncate">{obj.title}</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Donatore: {obj.donor.firstName && obj.donor.lastName
                    ? `${obj.donor.firstName} ${obj.donor.lastName}`
                    : obj.donor.name}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{obj._count.requests} richieste</span>
                  <span>{formatDate(obj.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}