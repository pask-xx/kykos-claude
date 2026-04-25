'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { CATEGORY_LABELS, CONDITION_LABELS, REQUEST_STATUS_LABELS, RequestStatus, Category, Condition } from '@/types';

interface ObjectDetails {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  imageUrls: string[] | null;
  status: string;
  donor: { name: string; latitude: number | null; longitude: number | null };
  intermediary: { id: string; name: string; latitude: number | null; longitude: number | null };
}

interface UserRequest {
  id: string;
  objectId: string;
  status: RequestStatus;
}

export default function ObjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const objectId = params.id as string;

  const [object, setObject] = useState<ObjectDetails | null>(null);
  const [userRequest, setUserRequest] = useState<UserRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [message, setMessage] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    fetchObjectDetails();
    fetchUserRequest();
  }, [objectId]);

  const fetchObjectDetails = async () => {
    try {
      const res = await fetch(`/api/objects/${objectId}`);
      const data = await res.json();
      if (res.ok) {
        setObject(data.object);
      }
    } catch (error) {
      console.error('Error fetching object:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRequest = async () => {
    try {
      const res = await fetch('/api/recipient/requests');
      const data = await res.json();
      const requests = data.requests || [];
      const existing = requests.find((r: UserRequest) => r.objectId === objectId);
      setUserRequest(existing || null);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleRequest = async () => {
    setRequesting(true);
    setMessage('');

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectId, message: requestMessage }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Errore nella richiesta');
        return;
      }

      setMessage('Richiesta inviata con successo!');
      setRequestMessage('');
      fetchUserRequest();
    } catch {
      setMessage('Errore di connessione');
    } finally {
      setRequesting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!userRequest) return;

    try {
      const res = await fetch(`/api/requests?id=${userRequest.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Errore annullamento richiesta');
        return;
      }

      setMessage('Richiesta annullata');
      fetchUserRequest();
    } catch {
      setMessage('Errore di connessione');
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      setMessage('Inserisci il motivo della segnalazione');
      return;
    }

    setReporting(true);
    setMessage('');

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectId,
          reason: reportReason,
          reportedTo: object?.intermediary.name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Errore nella segnalazione');
        return;
      }

      setMessage('Segnalazione inviata! Grazie per averci aiutato a migliorare.');
      setReportReason('');
      setShowReportModal(false);
    } catch {
      setMessage('Errore di connessione');
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!object) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <span className="text-5xl mb-4">🔍</span>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Oggetto non trovato</h2>
        <Link href="/recipient/objects" className="text-primary-600 hover:text-primary-700 font-medium">
          ← Torna agli oggetti
        </Link>
      </div>
    );
  }

  const images = object.imageUrls && object.imageUrls.length > 0 ? object.imageUrls : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/recipient/objects" className="text-2xl font-bold text-primary-600">KYKOS</Link>
            <nav className="flex items-center gap-6">
              <Link href="/recipient/dashboard" className="text-gray-600 hover:text-primary-600 font-medium">
                Dashboard
              </Link>
              <Link href="/recipient/objects" className="text-gray-600 hover:text-primary-600 font-medium">
                Oggetti
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/recipient/objects" className="text-gray-500 hover:text-gray-700 text-sm mb-4 inline-block">
          ← Torna agli oggetti
        </Link>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('annullata') ? 'bg-amber-50 text-amber-700' : message.includes('successo') || message.includes('inviata') ? 'bg-green-50 text-green-700' : message.includes('Segnalazione') ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Image Gallery */}
          <div className="relative">
            {images.length > 0 ? (
              <>
                <div className="aspect-video bg-gray-100">
                  <img
                    src={images[currentImageIndex]}
                    alt={`${object.title} - Immagine ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                {images.length > 1 && (
                  <div className="p-4 flex gap-2 overflow-x-auto">
                    {images.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                          index === currentImageIndex ? 'border-primary-500' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <span className="text-6xl">📦</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg font-medium">
                {CATEGORY_LABELS[object.category as Category] || object.category}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg font-medium">
                {CONDITION_LABELS[object.condition as Condition] || object.condition}
              </span>
              {userRequest && (
                <span className={`px-3 py-1 text-sm rounded-lg font-medium ${
                  userRequest.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                  userRequest.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                  userRequest.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {REQUEST_STATUS_LABELS[userRequest.status]}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{object.title}</h1>

            {object.description && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Descrizione</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{object.description}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Donatore</p>
                <p className="font-medium text-gray-900">{object.donor.name}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Ente di riferimento</p>
                <p className="font-medium text-gray-900">{object.intermediary.name}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t pt-6">
              {userRequest ? (
                userRequest.status === 'PENDING' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 font-medium">Richiesta in attesa di approvazione</p>
                      <p className="text-sm text-yellow-600 mt-1">L'ente sta valutando la tua richiesta. Riceverai una notifica quando sarà processata.</p>
                    </div>
                    <button
                      onClick={handleCancelRequest}
                      className="w-full py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition"
                    >
                      Annulla richiesta
                    </button>
                  </div>
                ) : (
                  <div className={`p-4 rounded-lg font-medium text-center ${
                    userRequest.status === 'APPROVED' ? 'bg-green-50 text-green-700 border border-green-200' :
                    userRequest.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200' :
                    'bg-gray-50 text-gray-700 border border-gray-200'
                  }`}>
                    {userRequest.status === 'APPROVED' ? '✓ Richiesta approvata! L\'ente ti contatterà per il ritiro.' :
                     userRequest.status === 'REJECTED' ? '✗ Richiesta rifiutata' :
                     'Richiesta non più attiva'}
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Messaggio opzionale (presentati brevemente)
                    </label>
                    <textarea
                      id="message"
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                      placeholder="Scrivi un breve messaggio all'ente..."
                    />
                  </div>
                  <button
                    onClick={handleRequest}
                    disabled={requesting}
                    className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {requesting ? 'Invio in corso...' : 'Richiedi questo oggetto'}
                  </button>
                </div>
              )}

              {/* Secondary Actions */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex-1 py-2 border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 hover:text-gray-700 transition"
                >
                  ⚠️ Segnala
                </button>
                <button
                  disabled
                  className="flex-1 py-2 border border-gray-300 text-gray-400 font-medium rounded-lg cursor-not-allowed"
                  title="Funzionalità in sviluppo"
                >
                  💬 Richiedi informazioni
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Segnala problema</h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Segnala questo annuncio all'amministratore del sistema e a <strong>{object.intermediary.name}</strong>.
              Verrà esaminato e potrebbe essere rimosso se non rispetta le linee guida.
            </p>
            <div className="mb-4">
              <label htmlFor="reportReason" className="block text-sm font-medium text-gray-700 mb-2">
                Motivo della segnalazione *
              </label>
              <textarea
                id="reportReason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                placeholder="Descrivi il problema (es: oggetto non disponibile, descrizione errata, comportamento inappropriato...)"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Annulla
              </button>
              <button
                onClick={handleReport}
                disabled={reporting}
                className="flex-1 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reporting ? 'Invio...' : 'Invia segnalazione'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}