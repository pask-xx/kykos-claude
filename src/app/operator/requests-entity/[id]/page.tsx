'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  beneficiary: {
    id: string;
    nickname: string | null;
    name: string;
    email: string;
  };
  intermediary: {
    id: string;
    name: string;
    address: string | null;
    houseNumber: string | null;
    cap: string | null;
    city: string | null;
    province: string | null;
    phone: string | null;
    email: string | null;
    hoursInfo: string | null;
  };
  fulfilledBy: {
    id: string;
    nickname: string | null;
    name: string;
    email: string;
  } | null;
  offers: Array<{
    id: string;
    message: string | null;
    status: string;
    createdAt: string;
    offeredBy: {
      id: string;
      nickname: string | null;
      name: string;
      email: string;
    };
  }>;
}

const STATUS_LABELS: Record<string, { label: string; bgColor: string; textColor: string }> = {
  PENDING: { label: 'In attesa', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
  APPROVED: { label: 'Approvata', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  FULFILLED: { label: 'Soddisfatta', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  DELIVERED: { label: 'Consegnata', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
  COMPLETED: { label: 'Completata', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  CANCELLED: { label: 'Cancellata', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
};

const OFFER_STATUS_LABELS: Record<string, { label: string; bgColor: string; textColor: string }> = {
  PENDING: { label: 'In attesa', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
  ACCEPTED: { label: 'Accettata', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  REJECTED: { label: 'Rifiutata', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  CANCELLED: { label: 'Cancellata', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
};

export default function GoodsRequestDetailPage() {
  const params = useParams();
  const [request, setRequest] = useState<GoodsRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequest();
  }, []);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/operator/requests-entity/${params.id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Richiesta non trovata');
        } else {
          setError('Errore nel caricamento');
        }
        return;
      }
      const data = await res.json();
      setRequest(data.goodsRequest);
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="text-center py-12">
        <span className="text-5xl mb-4 block">❌</span>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {error || 'Richiesta non trovata'}
        </h2>
        <Link
          href="/operator/requests-entity"
          className="text-primary-600 hover:text-primary-700 font-medium mt-4 inline-block"
        >
          ← Torna alle richieste
        </Link>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[request.status] || { label: request.status, bgColor: 'bg-gray-100', textColor: 'text-gray-700' };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/operator/requests-entity" className="hover:text-primary-600">
          Richieste
        </Link>
        <span>→</span>
        <span>Dettaglio richiesta</span>
      </div>

      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
            <p className="text-gray-500 mt-1">
              Richiesta da {request.beneficiary.nickname || request.beneficiary.name} • {formatDate(request.createdAt)}
            </p>
          </div>
          <span className={`px-3 py-1 ${statusInfo.bgColor} ${statusInfo.textColor} text-sm rounded-lg font-medium`}>
            {statusInfo.label}
          </span>
        </div>

        {request.description && (
          <p className="mt-4 text-gray-700">{request.description}</p>
        )}

        <div className="mt-4 flex items-center gap-4 text-sm">
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg">
            {CATEGORY_LABELS[request.category as keyof typeof CATEGORY_LABELS] || request.category}
          </span>
          <span className={`px-3 py-1 ${request.type === 'GOODS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'} rounded-lg`}>
            {request.type === 'GOODS' ? 'Bene' : 'Servizio'}
          </span>
        </div>
      </div>

      {/* Beneficiary Info */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Richiedente</h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center text-xl">
            😊
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {request.beneficiary.nickname || request.beneficiary.name}
            </p>
            <p className="text-sm text-gray-500">{request.beneficiary.email}</p>
          </div>
        </div>
      </div>

      {/* Offers Section */}
      {request.offers.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Offerte ({request.offers.length})
          </h2>
          <div className="space-y-4">
            {request.offers.map((offer) => {
              const offerStatusInfo = OFFER_STATUS_LABELS[offer.status] || { label: offer.status, bgColor: 'bg-gray-100', textColor: 'text-gray-700' };
              return (
                <div key={offer.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {offer.offeredBy.nickname || offer.offeredBy.name}
                      </p>
                      <p className="text-sm text-gray-500">{offer.offeredBy.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(offer.createdAt)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 ${offerStatusInfo.bgColor} ${offerStatusInfo.textColor} text-xs rounded-lg`}>
                      {offerStatusInfo.label}
                    </span>
                  </div>
                  {offer.message && (
                    <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {offer.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fulfiller Info (if fulfilled) */}
      {request.fulfilledBy && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Offerente</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-xl">
              🎁
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {request.fulfilledBy.nickname || request.fulfilledBy.name}
              </p>
              <p className="text-sm text-gray-500">{request.fulfilledBy.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Entity Info */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ente</h2>
        <p className="font-medium text-gray-900">{request.intermediary.name}</p>
        {request.intermediary.address && (
          <p className="text-sm text-gray-500 mt-1">
            {request.intermediary.address}
            {request.intermediary.houseNumber && ` ${request.intermediary.houseNumber}`}
            {request.intermediary.cap && `, ${request.intermediary.cap}`}
            {request.intermediary.city && ` ${request.intermediary.city}`}
            {request.intermediary.province && ` (${request.intermediary.province})`}
          </p>
        )}
        {request.intermediary.phone && (
          <p className="text-sm text-gray-500 mt-1">{request.intermediary.phone}</p>
        )}
      </div>
    </div>
  );
}