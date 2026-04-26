'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function PickupLocationPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;

  const [loading, setLoading] = useState(true);
  const [objectData, setObjectData] = useState<{
    title: string;
    depositLocation: string;
    objectId: string;
    recipientName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetchRequestData();
  }, [requestId]);

  const fetchRequestData = async () => {
    try {
      const res = await fetch(`/api/operator/requests/${requestId}/pickup`);
      if (res.ok) {
        const data = await res.json();
        setObjectData(data);
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
      const res = await fetch(`/api/operator/scan-qr/pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
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

  if (error && !objectData) {
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
            <div className="text-5xl mb-4">❌</div>
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
            <div className="text-5xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-green-700">Ritiro Completato!</h1>
            <p className="text-gray-600">
              Il beneficiario ha ritirato l&apos;oggetto con successo.
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
            <div className="text-5xl mb-4">📦</div>
            <h1 className="text-2xl font-bold text-gray-900">Ritiro Oggetto</h1>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {objectData && (
            <>
              {/* Object Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="font-semibold text-gray-900 mb-2">{objectData.title}</h2>
                <p className="text-sm text-gray-600">
                  Per: <strong>{objectData.recipientName}</strong>
                </p>
              </div>

              {/* Deposit Location */}
              {objectData.depositLocation ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-center mb-4">
                    <span className="text-4xl">📍</span>
                  </div>
                  <h3 className="text-lg font-semibold text-center text-green-800 mb-2">
                    Posizione oggetto
                  </h3>
                  <p className="text-2xl font-bold text-center text-green-900">
                    {objectData.depositLocation}
                  </p>
                  <p className="text-sm text-center text-green-600 mt-2">
                    Comunica questa posizione al beneficiario per il ritiro
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-4">⚠️</div>
                  <h3 className="font-semibold text-amber-800 mb-2">
                    Posizione non registrata
                  </h3>
                  <p className="text-sm text-amber-600">
                    L&apos;operatore non ha ancora registrato la posizione di deposito.
                    <br />
                    Assicurati che l&apos;oggetto sia disponibile prima di procedere.
                  </p>
                </div>
              )}

              {/* Complete Pickup Button */}
              <div className="space-y-4">
                <button
                  onClick={handleCompletePickup}
                  disabled={completing}
                  className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-lg disabled:opacity-50"
                >
                  {completing ? 'Elaborazione...' : 'Conferma Ritiro Completato'}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Cliccando confermi che il beneficiario ha ritirato l&apos;oggetto
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}