'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ObjectStatus, GoodsOfferStatus } from '@/types';

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

interface DeactivationPreview {
  objects: ObjectPreview[];
  goodsOffers: GoodsOfferPreview[];
  canDeactivate: boolean;
  blockingReasons: string[];
}

const STATUS_LABELS: Record<ObjectStatus, string> = {
  AVAILABLE: 'Disponibile',
  RESERVED: 'Riservato',
  DEPOSITED: 'Depositato',
  DONATED: 'Donato',
  CANCELLED: 'Cancellato',
  BLOCKED: 'Bloccato',
};

export default function DonorDeactivatePage() {
  const router = useRouter();
  const [preview, setPreview] = useState<DeactivationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

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
        // Redirect to home with success message
        router.push('/?deactivated=true');
      } else {
        const data = await res.json();
        setError(data.error || 'Errore durante la disattivazione');
        setShowConfirm(false);
      }
    } catch (err) {
      setError('Errore di rete');
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: ObjectStatus) => {
    const styles: Record<ObjectStatus, string> = {
      AVAILABLE: 'bg-green-100 text-green-700',
      RESERVED: 'bg-blue-100 text-blue-700',
      DEPOSITED: 'bg-purple-100 text-purple-700',
      DONATED: 'bg-gray-100 text-gray-700',
      CANCELLED: 'bg-gray-100 text-gray-500',
      BLOCKED: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded ${styles[status]}`}>
        {STATUS_LABELS[status]}
      </span>
    );
  };

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
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/donor/profile" className="text-primary-600 hover:underline">
            ← Torna al profilo
          </Link>
        </div>
      </div>
    );
  }

  const hasActiveTransactions =
    preview?.objects.filter((o) => o.status === 'AVAILABLE' || o.status === 'RESERVED').length ?? 0;
  const hasDepositedObjects = preview?.objects.some((o) => o.status === 'DEPOSITED') ?? false;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/donor/profile"
            className="text-sm text-gray-500 hover:text-primary-600 mb-2 inline-flex items-center gap-1"
          >
            ← Torna al profilo
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Disattivazione account</h1>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-amber-900">Azione irreversibile</h3>
              <p className="text-amber-700 text-sm mt-1">
                Una volta disattivato, l&apos;account non potrà essere ripristinato. Tutti i tuoi dati
                verranno eliminati in modo permanente.
              </p>
            </div>
          </div>
        </div>

        {/* Blocking Reasons */}
        {preview?.blockingReasons && preview.blockingReasons.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚫</span>
              <div>
                <h3 className="font-semibold text-red-900">Impossibile procedere</h3>
                <ul className="text-red-700 text-sm mt-2 list-disc list-inside space-y-1">
                  {preview.blockingReasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Objects Section */}
        {preview && preview.objects.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border mb-6">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Oggetti pubblicati ({preview.objects.length})
              </h2>
            </div>
            <div className="divide-y">
              {preview.objects.map((obj) => (
                <div key={obj.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{obj.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(obj.status)}
                      <span className="text-gray-400">→</span>
                      <span className="text-sm text-gray-600">{obj.willBe}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GoodsOffers Section */}
        {preview && preview.goodsOffers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border mb-6">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Offerte su richieste beni ({preview.goodsOffers.length})
              </h2>
            </div>
            <div className="divide-y">
              {preview.goodsOffers.map((offer) => (
                <div key={offer.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{offer.requestTitle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          offer.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-700'
                            : offer.status === 'ACCEPTED'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {offer.status === 'PENDING' ? 'In attesa' : offer.status}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm text-gray-600">{offer.willBe}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {preview && preview.objects.length === 0 && preview.goodsOffers.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <p className="text-gray-500">Nessun dato da gestire</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Link
            href="/donor/profile"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            Annulla
          </Link>

          {preview?.canDeactivate && (
            <ConfirmDialog
              title="Conferma disattivazione"
              message={`Stai per eliminare definitivamente il tuo account. Questa azione non può essere annullata.${hasActiveTransactions > 0 ? ` ${hasActiveTransactions} oggetti saranno cancellati.` : ''}`}
              confirmLabel="Disattiva account"
              variant="danger"
              onConfirm={handleDeactivate}
            >
              <button
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
              >
                {submitting ? 'Elaborazione...' : 'Disattiva account'}
              </button>
            </ConfirmDialog>
          )}
        </div>
      </div>
    </div>
  );
}