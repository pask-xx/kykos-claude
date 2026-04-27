'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Object {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  status: string;
  imageUrl: string | null;
  createdAt: string;
}

export default function DonorObjectsPage() {
  const [objects, setObjects] = useState<Object[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchObjects();
  }, []);

  const fetchObjects = async () => {
    try {
      const res = await fetch('/api/donor/objects');
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Le mie disponibilità</h1>
        <Link
          href="/donor/objects/new"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm"
        >
          + Nuovo oggetto
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Caricamento...</p>
        </div>
      ) : objects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
          <span className="text-5xl mb-4 block">📦</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessuna disponibilità</h2>
          <p className="text-gray-500 mb-6">Non hai ancora pubblicato disponibilità.</p>
          <Link href="/donor/objects/new" className="text-primary-600 hover:text-primary-700 font-medium">
            Pubblica il tuo primo oggetto →
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
          {objects.map((obj) => (
            <div key={obj.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {obj.imageUrl ? (
                  <img src={obj.imageUrl} alt={obj.title} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-5xl">📦</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {obj.category.replace('_', ' ')}
                  </span>
                  {getStatusBadge(obj.status)}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{obj.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {obj.description || 'Nessuna descrizione'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
