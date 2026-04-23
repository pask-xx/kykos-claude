'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface Request {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  object: {
    title: string;
    imageUrl: string | null;
    donor: { name: string };
  };
  recipient: { name: string };
}

export default function IntermediaryRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/intermediary/requests');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessing(requestId);

    try {
      const res = await fetch('/api/intermediary/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });

      if (res.ok) {
        fetchRequests();
      } else {
        const data = await res.json();
        alert(data.error || 'Errore');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Errore di connessione');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">In attesa</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Approvata</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Rifiutata</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{status}</span>;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const otherRequests = requests.filter(r => r.status !== 'PENDING');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary-600">KYKOS</Link>
            <nav className="flex items-center gap-6">
              <Link href="/intermediary/dashboard" className="text-gray-600 hover:text-primary-600 font-medium">
                Dashboard
              </Link>
              <Link href="/intermediary/requests" className="text-primary-600 font-medium">
                Richieste
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-medium text-gray-900 mb-6 text-center">Gestione richieste</h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Caricamento...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
            <span className="text-5xl mb-4 block">📋</span>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessuna richiesta</h2>
            <p className="text-gray-500">Non ci sono richieste da gestire.</p>
          </div>
        ) : (
          <>
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Richieste in attesa ({pendingRequests.length})
                </h2>
                <div className="space-y-4">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="bg-white p-4 rounded-xl shadow-sm border-2 border-amber-200 flex gap-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                        {req.object.imageUrl ? (
                          <img src={req.object.imageUrl} alt={req.object.title} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span className="text-3xl">📦</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{req.object.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Donatore: {req.object.donor.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Ricevente: {req.recipient.name}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                              Richiesta il {formatDate(req.createdAt)}
                            </p>
                            {req.message && (
                              <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                                Messaggio: {req.message}
                              </p>
                            )}
                          </div>
                          {getStatusBadge(req.status)}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleAction(req.id, 'approve')}
                            disabled={processing === req.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50"
                          >
                            {processing === req.id ? 'Elaborazione...' : 'Approva'}
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'reject')}
                            disabled={processing === req.id}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm disabled:opacity-50"
                          >
                            Rifiuta
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Requests */}
            {otherRequests.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Richieste elaborate
                </h2>
                <div className="space-y-4">
                  {otherRequests.map((req) => (
                    <div key={req.id} className="bg-white p-4 rounded-xl shadow-sm border flex gap-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                        {req.object.imageUrl ? (
                          <img src={req.object.imageUrl} alt={req.object.title} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span className="text-3xl">📦</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{req.object.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Donatore: {req.object.donor.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Ricevente: {req.recipient.name}
                            </p>
                          </div>
                          {getStatusBadge(req.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
