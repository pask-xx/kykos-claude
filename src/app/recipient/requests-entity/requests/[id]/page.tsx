'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import ConfirmDialog from '@/components/ConfirmDialog';

interface GoodsRequest {
  id: string;
  title: string;
  category: string;
  description: string | null;
  type: string;
  status: string;
  createdAt: string;
  beneficiary: {
    id: string;
    name: string;
    firstName: string | null;
    lastName: string | null;
  };
  intermediary: {
    id: string;
    name: string;
    address: string | null;
    houseNumber: string | null;
    cap: string | null;
    city: string | null;
    province: string | null;
  };
  fulfilledBy: {
    id: string;
    name: string;
  } | null;
  offers: Array<{
    id: string;
    message: string | null;
    status: string;
    createdAt: string;
    offeredBy: {
      id: string;
      name: string;
    };
  }>;
}

export default function GoodsRequestDetailPage() {
  const params = useParams();
  const [request, setRequest] = useState<GoodsRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequest();
  }, [params.id]);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/entity-requests?id=${params.id}`);
      const data = await res.json();
      if (res.ok) {
        setRequest(data.goodsRequest);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    if (!request) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/entity-requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept_offer', offerId }),
      });

      if (res.ok) {
        fetchRequest();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">In attesa</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Approvata</span>;
      case 'FULFILLED':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Soddisfatta</span>;
      case 'CANCELLED':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Cancellata</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{status}</span>;
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      FURNITURE: '🪑', ELECTRONICS: '📱', CLOTHING: '👕', BOOKS: '📚',
      KITCHEN: '🍳', SPORTS: '⚽', TOYS: '🧸', OTHER: '📦',
    };
    return icons[category] || '📦';
  };

  const getOfferStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">In attesa</span>;
      case 'ACCEPTED':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Accettata</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">Rifiutata</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Richiesta non trovata</h2>
        <Link href="/recipient/requests-entity/requests" className="text-primary-600 hover:underline mt-4 inline-block">
          Torna alle richieste
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/recipient/requests-entity/requests" className="text-gray-500 hover:text-gray-700">
          ← Indietro
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex gap-4">
          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
            {getCategoryIcon(request.category)}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
                <p className="text-gray-500 mt-1">
                  Richiesta da {request.beneficiary.name} • {formatDate(request.createdAt)}
                </p>
              </div>
              {getStatusBadge(request.status)}
            </div>
            {request.description && (
              <p className="text-gray-600 mt-3">{request.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Entity Info */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-2">📍 Ente di riferimento</h3>
        <p className="text-gray-700">{request.intermediary.name}</p>
        {(request.intermediary.address || request.intermediary.city) && (
          <p className="text-sm text-gray-500">
            {[request.intermediary.address, request.intermediary.houseNumber, request.intermediary.cap, request.intermediary.city, request.intermediary.province].filter(Boolean).join(', ')}
          </p>
        )}
      </div>

      {/* Fulfiller Info */}
      {request.fulfilledBy && (
        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">✓ Soddisfatta</h3>
        </div>
      )}

      {/* Offers Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Disponibilità ({request.offers.length})</h2>
        </div>

        {request.offers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nessuna disponibilità ancora</p>
        ) : (
          <div className="space-y-3">
            {request.offers.map((offer) => (
              <div key={offer.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Disponibilità</p>
                    <p className="text-sm text-gray-500">{formatDate(offer.createdAt)}</p>
                    {offer.message && (
                      <p className="text-gray-600 mt-2 text-sm">{offer.message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getOfferStatusBadge(offer.status)}
                    {offer.status === 'PENDING' && request.status === 'APPROVED' && !request.fulfilledBy && (
                      <ConfirmDialog
                        title="Accetta disponibilità"
                        message="Sei sicuro di voler accettare questa disponibilità?"
                        confirmLabel="Accetta"
                        variant="warning"
                        onConfirm={() => handleAcceptOffer(offer.id)}
                      >
                        <button
                          disabled={submitting}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          Accetta
                        </button>
                      </ConfirmDialog>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}