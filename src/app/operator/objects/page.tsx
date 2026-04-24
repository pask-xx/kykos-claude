'use client';

import { useState, useEffect } from 'react';
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
}

export default function OperatorObjectsPage() {
  const [objects, setObjects] = useState<Object[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestione oggetti</h1>
        <p className="text-gray-500">Visualizza e gestisci gli oggetti in entrata</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Caricamento...</p>
        </div>
      ) : objects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
          <span className="text-5xl mb-4 block">📦</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessun oggetto</h2>
          <p className="text-gray-500">Non ci sono oggetti per questo ente.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {objects.map((obj) => (
            <div key={obj.id} className="bg-white p-4 rounded-xl shadow-sm border">
              <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden mb-4">
                {obj.imageUrls && obj.imageUrls.length > 0 ? (
                  <img src={obj.imageUrls[0]} alt={obj.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">📦</span>
                )}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{obj.title}</h3>
                  <p className="text-sm text-gray-500">
                    {CATEGORY_LABELS[obj.category as keyof typeof CATEGORY_LABELS] || obj.category}
                  </p>
                  <p className="text-sm text-gray-400">
                    {CONDITION_LABELS[obj.condition as keyof typeof CONDITION_LABELS] || obj.condition}
                  </p>
                </div>
                {getStatusBadge(obj.status)}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Aggiunto il {formatDate(obj.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
