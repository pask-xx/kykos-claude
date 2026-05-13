'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { CATEGORY_LABELS } from '@/types';

interface GoodsRequest {
  id: string;
  title: string;
  category: string;
  description: string | null;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  fulfilledAt: string | null;
  depositLocation: string | null;
  depositNotes: string | null;
  beneficiary: {
    id: string;
    name: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  fulfilledBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  intermediary: {
    id: string;
    name: string;
    address: string | null;
    houseNumber: string | null;
    cap: string | null;
    city: string | null;
    province: string | null;
    phone: string | null;
  };
  offers: Array<{
    id: string;
    message: string | null;
    status: string;
    createdAt: string;
    imageUrls: string[];
    offeredBy: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

const GOODS_STATUS_LABELS: Record<string, string> = {
  PENDING: 'In attesa',
  APPROVED: 'Approvata',
  FULFILLED: 'Soddisfatta',
  DELIVERED: 'Depositata',
  COMPLETED: 'Completata',
  CANCELLED: 'Cancellata',
};

const GOODS_STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'In attesa' },
  APPROVED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Approvata' },
  FULFILLED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Soddisfatta' },
  DELIVERED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Depositata' },
  COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Completata' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancellata' },
};

export default function GoodsDetailPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = use(params);
  const [goods, setGoods] = useState<GoodsRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchGoods();
  }, [requestId]);

  const fetchGoods = async () => {
    try {
      const res = await fetch(`/api/entity-requests?id=${requestId}`);
      if (res.ok) {
        const data = await res.json();
        setGoods(data.goodsRequest);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badge = GOODS_STATUS_BADGES[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    return (
      <span className={`px-3 py-1 ${badge.bg} ${badge.text} text-sm rounded-full`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!goods) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Richiesta non trovata</p>
        <Link href="/operator/deposit" className="text-primary-600 hover:underline mt-2 inline-block">
          ← Torna ai depositi
        </Link>
      </div>
    );
  }

  // Collect all images from all offers
  const allImages: string[] = goods.offers?.flatMap(o => o.imageUrls || []) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/operator/deposit" className="text-sm text-gray-500 hover:text-primary-600 mb-2 inline-flex items-center gap-1">
            ← Tutti i depositi
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{goods.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            {getStatusBadge(goods.status)}
            <span className="text-sm text-gray-500">
              Aggiunto il {formatDate(goods.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Gallery */}
        <div className="space-y-4">
          {/* Main image */}
          <div className="bg-gray-100 rounded-xl overflow-hidden aspect-square flex items-center justify-center">
            {allImages.length > 0 ? (
              <img
                src={allImages[selectedImage]}
                alt={goods.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-8xl">🎁</span>
            )}
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allImages.map((url, index) => (
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
                  {CATEGORY_LABELS[goods.category as keyof typeof CATEGORY_LABELS] || goods.category}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Ente</dt>
                <dd className="font-medium text-gray-900">{goods.intermediary.name}</dd>
              </div>
              {goods.depositLocation && (
                <div>
                  <dt className="text-sm text-gray-500">Posizione deposito</dt>
                  <dd className="font-medium text-gray-900">{goods.depositLocation}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-500">Donatore</dt>
                <dd className="font-medium text-gray-900">{goods.fulfilledBy?.name || 'N/D'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Beneficiario</dt>
                <dd className="font-medium text-gray-900">{goods.beneficiary.name}</dd>
              </div>
              {goods.description && (
                <div>
                  <dt className="text-sm text-gray-500">Descrizione</dt>
                  <dd className="text-gray-700">{goods.description}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Creata</dt>
                <dd className="text-gray-900">{formatDate(goods.createdAt)}</dd>
              </div>
              {goods.fulfilledAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Soddisfatta</dt>
                  <dd className="text-gray-900">{formatDate(goods.fulfilledAt)}</dd>
                </div>
              )}
              {goods.updatedAt && goods.updatedAt !== goods.createdAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Ultima modifica</dt>
                  <dd className="text-gray-900">{formatDate(goods.updatedAt)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}