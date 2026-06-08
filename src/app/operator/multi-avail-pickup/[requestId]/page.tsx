'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { XCircle, CheckCircle2, Package, QrCode } from 'lucide-react';

interface MultiAvailabilityPickupData {
  title: string;
  beneficiaryName: string;
  beneficiaryEmail: string;
  qrCode: string;
  status: string;
  fulfilledAt: string | null;
}

export default function MultiAvailPickupPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;

  const [loading, setLoading] = useState(true);
  const [pickupData, setPickupData] = useState<MultiAvailabilityPickupData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetchRequestData();
  }, [requestId]);

  const fetchRequestData = async () => {
    try {
      const res = await fetch(`/api/operator/multi-avail-pickup/${requestId}`);
      if (res.ok) {
        const data = await res.json();
        setPickupData(data);
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
      const res = await fetch(`/api/operator/multi-avail-pickup/${requestId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  if (error && !pickupData) {
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
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-600" aria-hidden="true" />
            <h1 className="text-xl font-bold text-red-700 mb-2">Errore</h1>
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
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-600" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-green-700">Ritiro Completato!</h1>
            <p className="text-gray-600">
              Il beneficiario ha ritirato la disponibilità con successo.
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
            <h1 className="text-2xl font-bold text-gray-900">Ritiro Distribuzione</h1>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {pickupData && (
            <>
              {/* Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="font-semibold text-gray-900 mb-2">{pickupData.title}</h2>
                <p className="text-sm text-gray-600">
                  Per: <strong>{pickupData.beneficiaryName}</strong>
                </p>
                <p className="text-sm text-gray-500">{pickupData.beneficiaryEmail}</p>
              </div>

              {/* QR Code Display */}
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <QrCode className="w-10 h-10 text-primary-700" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-center text-primary-800 mb-2">
                  QR Code
                </h3>
                <p className="font-mono text-sm bg-white px-4 py-2 rounded border">
                  {pickupData.qrCode}
                </p>
              </div>

              {/* Status */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <p className="text-amber-800">
                  <strong>Stato attuale:</strong> {pickupData.status === 'ASSIGNED' ? 'Assegnato' : pickupData.status}
                </p>
              </div>

              {/* Complete Pickup Button */}
              <div className="space-y-4">
                <button
                  onClick={handleCompletePickup}
                  disabled={completing}
                  className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-lg disabled:opacity-50"
                >
                  {completing ? 'Elaborazione...' : 'Conferma Ritiro Completato'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}