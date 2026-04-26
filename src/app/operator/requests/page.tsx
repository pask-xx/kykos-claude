'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatDate } from '@/lib/utils';

interface Request {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  object: {
    id: string;
    title: string;
    imageUrls: string[];
    category: string;
    condition: string;
  };
  recipient: {
    id: string;
    name: string;
    email: string;
  };
}

export default function OperatorRequestsPage() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status') || 'pending';

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/operator/requests');
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
      const res = await fetch('/api/operator/requests', {
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
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{status}</span>
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const processedRequests = requests.filter(r => r.status !== 'PENDING');

  const displayRequests = statusFilter === 'processed' ? processedRequests : pendingRequests;
  const currentCount = statusFilter === 'processed' ? processedRequests.length : pendingRequests.length;
  const otherCount = statusFilter === 'processed' ? pendingRequests.length : processedRequests.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestione richieste</h1>
        <p className="text-gray-500">Visualizza e gestisci le richieste degli utenti</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-4 overflow-x-auto">
        <a
          href="/operator/requests?status=pending"
          className={`px-4 py-2 rounded-lg font-medium text-sm transition whitespace-nowrap ${
            statusFilter === 'pending'
              ? 'bg-amber-100 text-amber-700 border border-amber-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ⏳ In attesa ({pendingRequests.length})
        </a>
        <a
          href="/operator/requests?status=processed"
          className={`px-4 py-2 rounded-lg font-medium text-sm transition whitespace-nowrap ${
            statusFilter === 'processed'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ✓ Elaborate ({processedRequests.length})
        </a>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Caricamento...</p>
        </div>
      ) : displayRequests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
          <span className="text-5xl mb-4 block">{statusFilter === 'pending' ? '📋' : '✅'}</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {statusFilter === 'pending' ? 'Nessuna richiesta in attesa' : 'Nessuna richiesta elaborata'}
          </h2>
          <p className="text-gray-500">
            {statusFilter === 'pending'
              ? 'Tutte le richieste sono state elaborate!'
              : 'Non ci sono richieste elaborate.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayRequests.map((req) => (
            <div key={req.id} className={`bg-white p-4 rounded-xl shadow-sm border-2 flex flex-col gap-3 ${
              req.status === 'PENDING' ? 'border-amber-200' : 'border-gray-200'
            }`}>
              {/* Row 1: Image + Title + Date */}
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {req.object.imageUrls && req.object.imageUrls[0] ? (
                    <img
                      src={req.object.imageUrls[0]}
                      alt={req.object.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">📦</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{req.object.title}</h3>
                  <p className="text-xs text-gray-400">
                    Richiesta il {formatDate(req.createdAt)}
                  </p>
                </div>
              </div>

              {/* Row 2: Category + Condition */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                  {req.object.category}
                </span>
                <span>•</span>
                <span>{req.object.condition}</span>
              </div>

              {/* Row 3: Beneficiary + Status */}
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm">
                  <span className="text-gray-500">Beneficiario: </span>
                  <span className="text-gray-700 font-medium">{req.recipient.name}</span>
                </div>
                {getStatusBadge(req.status)}
              </div>

              {/* Row 4: Message (if exists) */}
              {req.message && (
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  Messaggio: {req.message}
                </p>
              )}

              {/* Row 5: Actions */}
              {req.status === 'PENDING' && (
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleAction(req.id, 'approve')}
                    disabled={processing === req.id}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50"
                  >
                    {processing === req.id ? 'Elaborazione...' : 'Approva'}
                  </button>
                  <button
                    onClick={() => handleAction(req.id, 'reject')}
                    disabled={processing === req.id}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm disabled:opacity-50"
                  >
                    Rifiuta
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}