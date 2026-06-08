'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { XCircle, CheckCircle2, Package, MapPin } from 'lucide-react';

interface GoodsPickupData {
  title: string;
  beneficiaryId: string;
  beneficiaryName: string;
  fulfilledByName: string;
  depositLocation: string | null;
  depositNotes: string | null;
}

export default function GoodsPickupPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;

  const [loading, setLoading] = useState(true);
  const [goodsData, setGoodsData] = useState<GoodsPickupData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetchGoodsData();
  }, [requestId]);

  const fetchGoodsData = async () => {
    try {
      const res = await fetch(`/api/entity-requests?id=${requestId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.goodsRequest) {
          setGoodsData({
            title: data.goodsRequest.title,
            beneficiaryId: data.goodsRequest.beneficiary?.id || '',
            beneficiaryName: data.goodsRequest.beneficiary?.name || 'Beneficiario',
            fulfilledByName: data.goodsRequest.fulfilledBy?.name || 'Donatore',
            depositLocation: data.goodsRequest.depositLocation || null,
            depositNotes: data.goodsRequest.depositNotes || null,
          });
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Richiesta non trovata');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePickup = async () => {
    setCompleting(true);
    try {
      // For goods requests, completing pickup means marking the request as fully fulfilled
      const res = await fetch(`/api/entity-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'complete_pickup' }),
      });

      if (res.ok) {
        setCompleted(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Errore durante il completamento');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (error && !goodsData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <button
              onClick={() => router.push('/operator/scan-qr')}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Torna alla scansione
            </button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-xl">
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-error-600" aria-hidden="true" />
            <h1 className="text-xl font-bold text-error-700 mb-2">Errore</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8 max-w-xl">
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center space-y-6">
            <CheckCircle2 className="w-12 h-12 mx-auto text-success-600" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-success-700">Ritiro Completato!</h1>
            <p className="text-gray-600">
              Il beneficiario ha ritirato il bene con successo.
            </p>
            <button
              onClick={() => router.push('/operator/scan-qr')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              ← Torna alla scansione
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/operator/scan-qr')}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Annulla
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-xl">
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          {/* Pickup Info */}
          <div className="text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-primary-600" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-gray-900">Ritiro Bene</h1>
          </div>

          {error && (
            <div className="p-4 bg-error-50 border border-error-200 text-error-700 rounded-lg">
              {error}
            </div>
          )}

          {goodsData && (
            <>
              {/* Object Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="font-semibold text-gray-900 mb-2">{goodsData.title}</h2>
                <p className="text-sm text-gray-500">
                  Per: <strong>{goodsData.beneficiaryName}</strong>
                </p>
                <p className="text-sm text-gray-500">
                  Donato da: {goodsData.fulfilledByName}
                </p>
                {goodsData.depositLocation && (
                  <p className="text-sm text-success-600 font-medium mt-2 inline-flex items-center gap-1">
                    <MapPin className="w-4 h-4" aria-hidden="true" />
                    Posizione: <strong>{goodsData.depositLocation}</strong>
                  </p>
                )}
                {goodsData.depositNotes && (
                  <p className="text-sm text-gray-500 mt-1">
                    Note: {goodsData.depositNotes}
                  </p>
                )}
              </div>

              {/* Info note */}
              <div className="bg-info-50 border border-info-200 rounded-lg p-4 text-center">
                <p className="text-sm text-info-700">
                  Consegna questo bene al beneficiario indicato
                </p>
              </div>

              {/* Complete Pickup Button */}
              <div className="space-y-4">
                <button
                  onClick={handleCompletePickup}
                  disabled={completing}
                  className="w-full py-4 bg-success-600 text-white rounded-lg hover:bg-success-700 font-semibold text-lg disabled:opacity-50"
                >
                  {completing ? 'Elaborazione...' : 'Conferma Ritiro Completato'}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Cliccando confermi che il beneficiario ha ritirato il bene
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}