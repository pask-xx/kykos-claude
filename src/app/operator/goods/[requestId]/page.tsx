'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  DELIVERED: 'Consegnata',
  COMPLETED: 'Completata',
  CANCELLED: 'Cancellata',
};

export default function GoodsDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;

  const [goods, setGoods] = useState<GoodsRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

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
    } catch (err) {
      console.error('Error fetching goods:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePickup = async () => {
    setCompleting(true);
    try {
      const res = await fetch(`/api/entity-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'complete_pickup' }),
      });

      if (res.ok) {
        router.push('/operator/deposit');
      }
    } catch (err) {
      console.error('Error completing pickup:', err);
    } finally {
      setCompleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">In attesa</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Approvata</span>;
      case 'FULFILLED':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Soddisfatta</span>;
      case 'DELIVERED':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Consegnata</span>;
      case 'COMPLETED':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Completata</span>;
      case 'CANCELLED':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Cancellata</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{status}</span>;
    }
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

  // Get all images from offers
  const allImages = goods.offers?.flatMap(o => o.imageUrls || []) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/operator/deposit" className="text-sm text-gray-500 hover:text-primary-600 mb-2 inline-flex items-center gap-1">
            ← Torna ai depositi
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{goods.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            {getStatusBadge(goods.status)}
            <span className="text-sm text-gray-500">
              {CATEGORY_LABELS[goods.category as keyof typeof CATEGORY_LABELS] || goods.category}
            </span>
          </div>
        </div>
      </div>

      {/* Images */}
      {allImages.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Foto</h2>
          <div className="flex flex-wrap gap-3">
            {allImages.map((url: string, i: number) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img
                  src={url}
                  alt={`Immagine ${i + 1}`}
                  className="w-24 h-24 object-cover rounded-lg border border-gray-200 hover:border-primary-400 transition-colors"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {goods.description && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Descrizione</h2>
          <p className="text-gray-600">{goods.description}</p>
        </div>
      )}

      {/* Deposit Location */}
      {goods.depositLocation && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h2 className="font-semibold text-amber-900 mb-1">📍 Posizione deposito</h2>
          <p className="text-amber-800 text-lg font-medium">{goods.depositLocation}</p>
          {goods.depositNotes && (
            <p className="text-amber-700 text-sm mt-1">{goods.depositNotes}</p>
          )}
        </div>
      )}

      {/* Donor Info */}
      {goods.fulfilledBy && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h2 className="font-semibold text-blue-900 mb-2">🎁 Donatore</h2>
          <p className="text-blue-800 font-medium">{goods.fulfilledBy.name}</p>
          <p className="text-blue-600 text-sm">{goods.fulfilledBy.email}</p>
        </div>
      )}

      {/* Beneficiary Info */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <h2 className="font-semibold text-green-900 mb-2">🙋 Beneficiario</h2>
        <p className="text-green-800 font-medium">{goods.beneficiary.name}</p>
        <p className="text-green-600 text-sm">{goods.beneficiary.email}</p>
      </div>

      {/* Entity Info */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h2 className="font-semibold text-gray-900 mb-2">🏢 Ente</h2>
        <p className="text-gray-700">{goods.intermediary.name}</p>
        {(goods.intermediary.address || goods.intermediary.city) && (
          <p className="text-gray-500 text-sm">
            {[goods.intermediary.address, goods.intermediary.houseNumber, goods.intermediary.cap, goods.intermediary.city, goods.intermediary.province].filter(Boolean).join(', ')}
          </p>
        )}
      </div>

      {/* Actions - only for DELIVERED status */}
      {goods.status === 'DELIVERED' && (
        <div className="flex gap-3">
          <button
            onClick={handleCompletePickup}
            disabled={completing}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
          >
            {completing ? 'Elaborazione...' : '✓ Conferma ritiro'}
          </button>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Cronologia</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-600">Creata il {formatDate(goods.createdAt)}</span>
          </div>
          {goods.fulfilledAt && (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-600">Soddisfatta il {formatDate(goods.fulfilledAt)}</span>
            </div>
          )}
          {goods.status === 'DELIVERED' && (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-600">Consegnata all&apos;ente</span>
            </div>
          )}
          {goods.status === 'COMPLETED' && (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-gray-600">Ritirata dal beneficiario</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}