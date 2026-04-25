'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/types';

interface ObjectDetail {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  status: string;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
  donor: { id: string; name: string };
  intermediary: { id: string; name: string };
}

export default function ObjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [object, setObject] = useState<ObjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchObject();
  }, [id]);

  const fetchObject = async () => {
    try {
      const res = await fetch(`/api/operator/objects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setObject(data.object);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">Disponibile</span>;
      case 'RESERVED':
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">Riservato</span>;
      case 'DONATED':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">Donato</span>;
      case 'WITHDRAWN':
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">Ritirato</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!object) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Oggetto non trovato</p>
        <Link href="/operator/objects" className="text-primary-600 hover:underline mt-2 inline-block">
          ← Torna alle disponibilità
        </Link>
      </div>
    );
  }

  const images = object.imageUrls && object.imageUrls.length > 0 ? object.imageUrls : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/operator/objects" className="text-sm text-gray-500 hover:text-primary-600 mb-2 inline-flex items-center gap-1">
            ← Tutte le disponibilità
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{object.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            {getStatusBadge(object.status)}
            <span className="text-sm text-gray-500">
              Aggiunto il {formatDate(object.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Gallery */}
        <div className="space-y-4">
          {/* Main image */}
          <div className="bg-gray-100 rounded-xl overflow-hidden aspect-square flex items-center justify-center">
            {images.length > 0 ? (
              <img
                src={images[selectedImage]}
                alt={object.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-8xl">📦</span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${
                    selectedImage === index ? 'border-primary-500' : 'border-transparent'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dettagli</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Categoria</dt>
                <dd className="font-medium text-gray-900">
                  {CATEGORY_LABELS[object.category as keyof typeof CATEGORY_LABELS] || object.category}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Condizione</dt>
                <dd className="font-medium text-gray-900">
                  {CONDITION_LABELS[object.condition as keyof typeof CONDITION_LABELS] || object.condition}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Ente</dt>
                <dd className="font-medium text-gray-900">{object.intermediary.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Donatore</dt>
                <dd className="font-medium text-gray-900">{object.donor.name}</dd>
              </div>
              {object.description && (
                <div>
                  <dt className="text-sm text-gray-500">Descrizione</dt>
                  <dd className="text-gray-700">{object.description}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Creato</dt>
                <dd className="text-gray-900">{formatDate(object.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Ultima modifica</dt>
                <dd className="text-gray-900">{formatDate(object.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
