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
    imageUrls: string[] | null;
    donor: { name: string };
  };
  recipient: { name: string; firstName: string | null; lastName: string | null };
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
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="bg-white p-3 rounded-xl shadow-sm border-2 border-amber-200">
                      <div className="flex items-center justify-between gap-4">
                        {/* Left section: image + badge + title + beneficiary */}
                        <div className="flex items-center gap-3">
                          {/* Image */}
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {req.object.imageUrls && req.object.imageUrls[0] ? (
                              <img src={req.object.imageUrls[0]} alt={req.object.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-xl">📦</span>
                              </div>
                            )}
                          </div>

                          {/* Badge */}
                          <div className="flex-shrink-0">
                            {getStatusBadge(req.status)}
                          </div>

                          {/* Title + Beneficiary */}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate max-w-32">{req.object.title}</p>
                            <p className="text-xs text-gray-500 truncate max-w-32">
                              {req.recipient.firstName && req.recipient.lastName
                                ? `${req.recipient.firstName} ${req.recipient.lastName}`
                                : req.recipient.name}
                            </p>
                          </div>
                        </div>

                        {/* Center section: donor + date */}
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Donatore</p>
                            <p className="font-medium text-gray-900 text-sm truncate max-w-24">{req.object.donor.name}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Data</p>
                            <p className="font-medium text-gray-900 text-sm">{formatDate(req.createdAt)}</p>
                          </div>
                        </div>

                        {/* Right section: actions */}
                        <div className="flex items-center gap-2 flex-shrink-0 w-36 justify-end">
                          <button
                            onClick={() => handleAction(req.id, 'reject')}
                            disabled={processing === req.id}
                            className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                          >
                            Rifiuta
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'approve')}
                            disabled={processing === req.id}
                            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {processing === req.id ? '...' : 'Approva'}
                          </button>
                        </div>
                      </div>
                      {req.message && (
                        <p className="text-xs text-gray-500 mt-2 truncate">
                          <span className="font-medium">Msg:</span> {req.message}
                        </p>
                      )}
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
                <div className="space-y-3">
                  {otherRequests.map((req) => (
                    <div key={req.id} className="bg-white p-3 rounded-xl shadow-sm border">
                      <div className="flex items-center justify-between gap-4">
                        {/* Left section: image + badge + title + beneficiary */}
                        <div className="flex items-center gap-3">
                          {/* Image */}
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {req.object.imageUrls && req.object.imageUrls[0] ? (
                              <img src={req.object.imageUrls[0]} alt={req.object.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-xl">📦</span>
                              </div>
                            )}
                          </div>

                          {/* Badge */}
                          <div className="flex-shrink-0">
                            {getStatusBadge(req.status)}
                          </div>

                          {/* Title + Beneficiary */}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate max-w-32">{req.object.title}</p>
                            <p className="text-xs text-gray-500 truncate max-w-32">
                              {req.recipient.firstName && req.recipient.lastName
                                ? `${req.recipient.firstName} ${req.recipient.lastName}`
                                : req.recipient.name}
                            </p>
                          </div>
                        </div>

                        {/* Center section: donor + date */}
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Donatore</p>
                            <p className="font-medium text-gray-900 text-sm truncate max-w-24">{req.object.donor.name}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Data</p>
                            <p className="font-medium text-gray-900 text-sm">{formatDate(req.createdAt)}</p>
                          </div>
                        </div>

                        {/* Right section: empty or placeholder */}
                        <div className="w-24" />
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
