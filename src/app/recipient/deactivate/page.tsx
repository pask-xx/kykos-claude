'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ObjectStatus, GoodsOfferStatus, GoodsRequestStatus } from '@/types';

interface ObjectPreview {
  id: string;
  title: string;
  status: ObjectStatus;
  requestId: string | null;
  willBe: string;
}

interface GoodsOfferPreview {
  id: string;
  requestTitle: string;
  status: GoodsOfferStatus;
  willBe: string;
}

interface RequestPreview {
  id: string;
  objectTitle: string;
  objectStatus: ObjectStatus;
  willBe: string;
}

interface GoodsRequestPreview {
  id: string;
  title: string;
  status: GoodsRequestStatus;
  willBe: string;
}

interface DeactivationPreview {
  objects: ObjectPreview[];
  goodsOffers: GoodsOfferPreview[];
  requests: RequestPreview[];
  goodsRequests: GoodsRequestPreview[];
}

const OBJECT_STATUS_LABELS: Record<ObjectStatus, string> = {
  AVAILABLE: 'Disponibile',
  RESERVED: 'Riservata',
  DEPOSITED: 'Depositata',
  DONATED: 'Ritirato',
  CANCELLED: 'Cancellato',
  BLOCKED: 'Bloccato',
};

const GOODS_REQUEST_STATUS_LABELS: Record<GoodsRequestStatus, string> = {
  PENDING: 'In attesa',
  APPROVED: 'Approvata',
  FULFILLED: 'Soddisfatta',
  DELIVERED: 'Depositata',
  COMPLETED: 'Completata',
  CANCELLED: 'Cancellata',
};

const GOODS_OFFER_STATUS_LABELS: Record<GoodsOfferStatus, string> = {
  PENDING: 'In attesa',
  ACCEPTED: 'Accettata',
  REJECTED: 'Rifiutata',
  CANCELLED: 'Cancellata',
};

export default function RecipientDeactivatePage() {
  const router = useRouter();
  const [preview, setPreview] = useState<DeactivationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreview();
  }, []);

  const fetchPreview = async () => {
    try {
      const res = await fetch('/api/profile/deactivate');
      if (res.ok) {
        const data = await res.json();
        setPreview(data.preview);
      } else {
        setError('Errore nel caricamento');
      }
    } catch (err) {
      setError('Errore di rete');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/profile/deactivate', {
        method: 'POST',
      });

      if (res.ok) {
        router.push('/?deactivated=true');
      } else {
        const data = await res.json();
        setError(data.error || 'Errore durante la disattivazione');
      }
    } catch (err) {
      setError('Errore di rete');
    } finally {
      setSubmitting(false);
    }
  };

  const getObjectStatusBadge = (status: ObjectStatus) => {
    const styles: Record<ObjectStatus, string> = {
      AVAILABLE: 'bg-success-100 text-success-700',
      RESERVED: 'bg-warning-100 text-warning-700',
      DEPOSITED: 'bg-info-100 text-info-700',
      DONATED: 'bg-gray-100 text-gray-700',
      CANCELLED: 'bg-gray-100 text-gray-500',
      BLOCKED: 'bg-error-100 text-error-700',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded ${styles[status]}`}>
        {OBJECT_STATUS_LABELS[status]}
      </span>
    );
  };

  const getGoodsRequestStatusBadge = (status: GoodsRequestStatus) => {
    const styles: Record<GoodsRequestStatus, string> = {
      PENDING: 'bg-warning-100 text-warning-700',
      APPROVED: 'bg-info-100 text-info-700',
      FULFILLED: 'bg-indigo-100 text-indigo-700',
      DELIVERED: 'bg-secondary-100 text-secondary-700',
      COMPLETED: 'bg-gray-100 text-gray-700',
      CANCELLED: 'bg-gray-100 text-gray-500',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded ${styles[status]}`}>
        {GOODS_REQUEST_STATUS_LABELS[status]}
      </span>
    );
  };

  const getOfferStatusBadge = (status: GoodsOfferStatus) => {
    const styles: Record<GoodsOfferStatus, string> = {
      PENDING: 'bg-warning-100 text-warning-700',
      ACCEPTED: 'bg-info-100 text-info-700',
      REJECTED: 'bg-gray-100 text-gray-700',
      CANCELLED: 'bg-gray-100 text-gray-500',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded ${styles[status]}`}>
        {GOODS_OFFER_STATUS_LABELS[status]}
      </span>
    );
  };

  // Filter out terminal states - they don't need any action
  const activeObjects = preview?.objects.filter(
    (o) => o.status === 'AVAILABLE' || o.status === 'RESERVED'
  ) ?? [];
  const activeOffers = preview?.goodsOffers.filter(
    (o) => o.status === 'PENDING' || o.status === 'ACCEPTED'
  ) ?? [];
  const activeRequests = preview?.requests.filter(
    (r) => r.objectStatus === 'AVAILABLE' || r.objectStatus === 'RESERVED'
  ) ?? [];
  const activeGoodsRequests = preview?.goodsRequests.filter(
    (gr) => gr.status === 'PENDING' || gr.status === 'APPROVED' || gr.status === 'FULFILLED' || gr.status === 'DELIVERED'
  ) ?? [];

  const totalActive = activeObjects.length + activeOffers.length + activeRequests.length + activeGoodsRequests.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (error && !preview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 mb-4">{error}</p>
          <Link href="/recipient/profile" className="text-primary-600 hover:underline">
            ← Torna al profilo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/recipient/profile"
            className="text-sm text-gray-500 hover:text-primary-600 mb-2 inline-flex items-center gap-1"
          >
            ← Torna al profilo
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Disattivazione account</h1>
        </div>

        {/* Warning Banner */}
        <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-warning-600 flex-shrink-0" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-warning-900">Azione irreversibile</h3>
              <p className="text-warning-700 text-sm mt-1">
                Una volta disattivato, l&apos;account non potrà essere ripristinato. Tutti i tuoi dati
                verranno eliminati in modo permanente.
              </p>
            </div>
          </div>
        </div>

        {/* Objects Section (as Donor) */}
        {activeObjects.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border mb-6">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Oggetti pubblicati ({activeObjects.length})
              </h2>
            </div>
            <div className="divide-y">
              {activeObjects.map((obj) => (
                <div key={obj.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{obj.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getObjectStatusBadge(obj.status)}
                      <span className="text-gray-400">→</span>
                      <span className="text-sm text-gray-600">{obj.willBe}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GoodsOffers Section (as Donor) */}
        {activeOffers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border mb-6">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Offerte su richieste beni ({activeOffers.length})
              </h2>
            </div>
            <div className="divide-y">
              {activeOffers.map((offer) => (
                <div key={offer.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{offer.requestTitle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getOfferStatusBadge(offer.status)}
                      <span className="text-gray-400">→</span>
                      <span className="text-sm text-gray-600">{offer.willBe}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requests Made Section (as Recipient) */}
        {activeRequests.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border mb-6">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Richieste oggetti ({activeRequests.length})
              </h2>
            </div>
            <div className="divide-y">
              {activeRequests.map((req) => (
                <div key={req.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{req.objectTitle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getObjectStatusBadge(req.objectStatus)}
                      <span className="text-gray-400">→</span>
                      <span className="text-sm text-gray-600">{req.willBe}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GoodsRequests Created Section (as Recipient) */}
        {activeGoodsRequests.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border mb-6">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Richieste beni ({activeGoodsRequests.length})
              </h2>
            </div>
            <div className="divide-y">
              {activeGoodsRequests.map((gr) => (
                <div key={gr.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{gr.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getGoodsRequestStatusBadge(gr.status)}
                      <span className="text-gray-400">→</span>
                      <span className="text-sm text-gray-600">{gr.willBe}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {totalActive === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <p className="text-gray-500">Nessun dato da gestire</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-xl p-4 mb-6">
            <p className="text-error-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Link
            href="/recipient/profile"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            Annulla
          </Link>

          <ConfirmDialog
            title="Conferma disattivazione"
            message={`Stai per eliminare definitivamente il tuo account. Questa azione non può essere annullata.${totalActive > 0 ? ` ${totalActive} elementi saranno cancellati.` : ''}`}
            confirmLabel="Disattiva account"
            variant="danger"
            onConfirm={handleDeactivate}
          >
            <button
              disabled={submitting}
              className="px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 font-medium disabled:opacity-50"
            >
              {submitting ? 'Elaborazione...' : 'Disattiva account'}
            </button>
          </ConfirmDialog>
        </div>
      </div>
    </div>
  );
}