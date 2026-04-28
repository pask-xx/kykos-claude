'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface GoodsRequest {
  id: string;
  title: string;
  description: string | null;
  category: string;
  type: string;
  createdAt: string;
  intermediary: {
    id: string;
    name: string;
  };
  _count: { offers: number };
  alreadyOffered: boolean;
}

export default function DonorRequestsClient() {
  const [requests, setRequests] = useState<GoodsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offeringId, setOfferingId] = useState<string | null>(null);
  const [offerSuccess, setOfferSuccess] = useState<string | null>(null);
  const [offerMessage, setOfferMessage] = useState('');
  const [offeringForId, setOfferingForId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<string | null>(null);

  const fetchRequests = useCallback(async (cursor: string | null = null, silent = false) => {
    try {
      const url = cursor
        ? `/api/donor/requests?cursor=${cursor}&limit=10`
        : '/api/donor/requests?limit=10';

      const res = await fetch(url);
      if (!res.ok) throw new Error('Errore nel caricamento');

      const data = await res.json();

      if (cursor) {
        setRequests(prev => [...prev, ...data.requests]);
      } else {
        setRequests(data.requests);
      }

      setCursor(data.nextCursor);
      setHasNextPage(data.hasNextPage);
      lastFetchRef.current = data.requests[0]?.id || null;
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Errore generico');
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchRequests().finally(() => setLoading(false));
  }, [fetchRequests]);

  // Load more when scrolling
  useEffect(() => {
    if (!hasNextPage || !loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasNextPage) {
          setLoadingMore(true);
          fetchRequests(cursor).finally(() => setLoadingMore(false));
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasNextPage, loadingMore, cursor, fetchRequests]);

  // Auto-refresh when user reached the end
  useEffect(() => {
    if (!hasNextPage && requests.length > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetch('/api/donor/requests?limit=1')
          .then(res => res.json())
          .then(data => {
            if (data.requests.length > 0 && data.requests[0].id !== lastFetchRef.current) {
              fetchRequests(null, true);
            }
          })
          .catch(() => {});
      }, 30000);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [hasNextPage, requests.length, fetchRequests]);

  const handleOffer = async (requestId: string) => {
    setOfferingId(requestId);
    setError(null);
    setOfferSuccess(null);

    try {
      const res = await fetch('/api/donor/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, message: offerMessage }),
      });

      if (res.ok) {
        setOfferSuccess('Offerta inviata con successo!');
        setOfferingForId(null);
        setOfferMessage('');
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, alreadyOffered: true, _count: { ...r._count, offers: r._count.offers + 1 } } : r));
        setTimeout(() => setOfferSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Errore nell\'offerta');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setOfferingId(null);
    }
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

  const typeColors: Record<string, string> = {
    GOODS: 'bg-primary-100 text-primary-700',
    SERVICES: 'bg-purple-100 text-purple-700',
  };

  const typeLabels: Record<string, string> = {
    GOODS: 'Beni',
    SERVICES: 'Servizi',
  };

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
        <button
          onClick={() => { setError(null); setLoading(true); fetchRequests().finally(() => setLoading(false)); }}
          className="mt-2 text-sm text-primary-600 hover:underline"
        >
          Riprova
        </button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna richiesta</h3>
        <p className="text-gray-500 text-sm">Al momento non ci sono richieste disponibili.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success/Error Messages */}
      {offerSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-center text-sm">
          {offerSuccess}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center text-sm">
          {error}
        </div>
      )}

      {requests.map((req) => (
        <div
          key={req.id}
          className="bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-200"
        >
          {/* Collapsed Card */}
          <div
            className="cursor-pointer"
            onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  req.type === 'SERVICES' ? 'bg-purple-100' : 'bg-primary-100'
                }`}>
                  <span className="text-2xl">{req.type === 'SERVICES' ? '🛠️' : '📦'}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{req.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[req.type]}`}>
                      {typeLabels[req.type]}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {categoryLabels[req.category] || req.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {new Date(req.createdAt).toLocaleDateString('it-IT')}
                    <span className="mx-1.5">•</span>
                    {req.intermediary.name}
                    {req._count.offers > 0 && (
                      <span className="ml-2 text-amber-600">• {req._count.offers} offerta{req._count.offers !== 1 ? 'e' : ''}</span>
                    )}
                  </p>
                </div>

                {/* Expand icon */}
                <div className="flex-shrink-0 flex items-center">
                  <span className={`text-gray-400 transition-transform duration-200 ${expandedId === req.id ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Content */}
          {expandedId === req.id && (
            <div className="border-t border-gray-100 p-4 bg-gray-50">
              {/* Description */}
              {req.description ? (
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">{req.description}</p>
              ) : (
                <p className="text-gray-400 italic mb-4 text-sm">Nessuna descrizione</p>
              )}

              {/* Anonymous notice */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-xs text-blue-700">
                <span className="font-medium">🔒 Anonimato</span>
                <p className="mt-1">La richiesta è anonima. Non puoi vedere chi l'ha fatta.</p>
              </div>

              {/* Offer form or already offered */}
              {req.alreadyOffered ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <span className="text-amber-700 font-medium text-sm">✓ Hai già inviato un'offerta per questa richiesta</span>
                </div>
              ) : offeringForId === req.id ? (
                <div className="space-y-3">
                  <textarea
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    placeholder="Aggiungi un messaggio (facoltativo)..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOffer(req.id);
                      }}
                      disabled={offeringId === req.id}
                      className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        req.type === 'SERVICES'
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {offeringId === req.id ? 'Invio...' : req.type === 'SERVICES' ? 'Offri servizio' : 'Fornisci'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOfferingForId(null);
                      }}
                      className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOfferingForId(req.id);
                  }}
                  className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors ${
                    req.type === 'SERVICES'
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {req.type === 'SERVICES' ? 'Offri servizio' : 'Fornisci'}
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Load more trigger */}
      {hasNextPage ? (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {loadingMore && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-gray-400">
          Fine delle richieste
        </div>
      )}
    </div>
  );
}