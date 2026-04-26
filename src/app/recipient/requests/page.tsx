'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface RequestObject {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  object: {
    id: string;
    title: string;
    category: string;
    condition: string;
    imageUrls: string[];
    status: string;
    depositLocation: string | null;
  };
  donation: {
    id: string;
    amount: string;
    createdAt: string;
  } | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'In attesa', color: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Approvata', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rifiutata', color: 'bg-red-100 text-red-700' },
  EXPIRED: { label: 'Scaduta', color: 'bg-gray-100 text-gray-700' },
};

const objectStatusLabels: Record<string, { label: string; color: string; icon: string }> = {
  AVAILABLE: { label: 'Disponibile', color: 'bg-green-100 text-green-700', icon: '📦' },
  RESERVED: { label: 'In attesa consegna', color: 'bg-amber-100 text-amber-700', icon: '⏳' },
  WITHDRAWN: { label: 'Pronto per ritiro', color: 'bg-blue-100 text-blue-700', icon: '📱' },
  DONATED: { label: 'Ritirato', color: 'bg-gray-100 text-gray-700', icon: '✅' },
  BLOCKED: { label: 'Bloccato', color: 'bg-red-100 text-red-700', icon: '🚫' },
};

const categoryLabels: Record<string, string> = {
  FURNITURE: 'Arredamento',
  ELECTRONICS: 'Elettronica',
  CLOTHING: 'Abbigliamento',
  BOOKS: 'Libri',
  KITCHEN: 'Cucina',
  SPORTS: 'Sport',
  TOYS: 'Giocattoli',
  OTHER: 'Altro',
};

const conditionLabels: Record<string, string> = {
  NEW: 'Nuovo',
  LIKE_NEW: 'Come nuovo',
  GOOD: 'Buono',
  FAIR: 'Discreto',
  POOR: 'Usurato',
};

export default function RecipientRequestsPage() {
  const [requests, setRequests] = useState<RequestObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/recipient/requests');
      if (!res.ok) throw new Error('Errore nel caricamento');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore generico');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    const objectStatus = r.object.status;
    if (filter === 'active') return objectStatus !== 'DONATED';
    if (filter === 'completed') return objectStatus === 'DONATED';
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>{error}</p>
        <button onClick={fetchRequests} className="mt-2 text-sm text-primary-600 hover:underline">
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium text-gray-900">Le mie richieste</h1>
          <p className="text-gray-500">Stato delle tue richieste di oggetti</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-4">
        {[
          { key: 'all', label: 'Tutte' },
          { key: 'active', label: 'Attive' },
          { key: 'completed', label: 'Completate' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              filter === tab.key
                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
          <span className="text-5xl mb-4 block">📋</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessuna richiesta</h2>
          <p className="text-gray-500">
            {filter === 'all'
              ? 'Non hai ancora richiesto nessun oggetto.'
              : `Non ci sono richieste ${filter === 'active' ? 'attive' : 'completate'}.`}
          </p>
          <Link
            href="/recipient/dashboard"
            className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Sfoglia gli oggetti disponibili
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const requestStatus = statusLabels[request.status] || { label: request.status, color: 'bg-gray-100 text-gray-700' };
            const objStatus = objectStatusLabels[request.object.status] || { label: request.object.status, color: 'bg-gray-100 text-gray-700', icon: '📦' };

            return (
              <div
                key={request.id}
                className="bg-white rounded-xl shadow-sm border w-full p-4"
              >
                {/* Mobile-first stacked layout */}
                <div className="flex flex-col gap-3">
                  {/* Row 1: Image + Title */}
                  <div className="flex gap-3">
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      {request.object.imageUrls && request.object.imageUrls.length > 0 ? (
                        <img
                          src={request.object.imageUrls[0]}
                          alt={request.object.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{request.object.title}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Richiesta il {new Date(request.createdAt).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>

                  {/* Row 2: Category + Condition */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                      {categoryLabels[request.object.category] || request.object.category}
                    </span>
                    <span>•</span>
                    <span>{conditionLabels[request.object.condition]}</span>
                  </div>

                  {/* Row 3: Object Status + Action */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded font-medium ${objStatus.color}`}>
                      <span>{objStatus.icon}</span>
                      {objStatus.label}
                    </span>
                    {request.object.status === 'WITHDRAWN' && (
                      <Link
                        href={`/recipient/qr/${request.id}`}
                        className="inline-block px-3 py-1.5 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 font-medium text-xs"
                      >
                        📱 Ritira
                      </Link>
                    )}
                  </div>

                  {/* Row 4: Request message (if exists) */}
                  {request.message && (
                    <p className="text-sm text-gray-600 italic">"{request.message}"</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}