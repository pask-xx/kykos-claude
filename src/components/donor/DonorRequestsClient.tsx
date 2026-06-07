'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, Package, Briefcase, ClipboardList, ChevronDown, Check, Lock, Inbox } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import ImageUploader from '@/components/ImageUploader';
import { toast } from '@/components/ui/Toast';
import { Alert, Badge, Button, EmptyState, Spinner, Textarea } from '@/components/ui';

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

interface Cause {
  id: string;
  title: string;
  description: string;
  imageUrls: string[];
  targetQty: number | null;
  deadline: string | null;
  organization: { id: string; name: string; city: string | null };
  participantCount: number;
  hasJoined: boolean;
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
  const [offerMessage, setOfferMessage] = useState('');
  const [offeringForId, setOfferingForId] = useState<string | null>(null);
  const [offerImages, setOfferImages] = useState<string[]>([]);
  const [causes, setCauses] = useState<Cause[]>([]);
  const [joiningCauseId, setJoiningCauseId] = useState<string | null>(null);
  const [expandedCauseId, setExpandedCauseId] = useState<string | null>(null);
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

  const fetchCauses = useCallback(async () => {
    try {
      const res = await fetch('/api/causes');
      if (res.ok) {
        const data = await res.json();
        setCauses(data.causes || []);
      }
    } catch (err) {
      console.error('Error fetching causes:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchRequests(),
      fetchCauses(),
    ]).finally(() => setLoading(false));
  }, [fetchRequests, fetchCauses]);

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
      const tick = () => {
        if (document.visibilityState !== 'visible') return;
        fetch('/api/donor/requests?limit=1')
          .then(res => res.json())
          .then(data => {
            if (data.requests.length > 0 && data.requests[0].id !== lastFetchRef.current) {
              fetchRequests(null, true);
            }
          })
          .catch(() => {});
      };

      refreshIntervalRef.current = setInterval(tick, 30000);

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

    try {
      const res = await fetch('/api/donor/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, message: offerMessage, imageUrls: offerImages }),
      });

      if (res.ok) {
        toast.success('Offerta inviata con successo!');
        setOfferingForId(null);
        setOfferMessage('');
        setOfferImages([]);
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, alreadyOffered: true, _count: { ...r._count, offers: r._count.offers + 1 } } : r));
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

  const handleJoinCause = async (causeId: string) => {
    setJoiningCauseId(causeId);
    try {
      const res = await fetch(`/api/causes/${causeId}/join`, { method: 'POST' });
      if (res.ok) {
        setCauses(prev =>
          prev.map(c => c.id === causeId ? { ...c, hasJoined: true } : c)
        );
      } else {
        const data = await res.json();
        setError(data.error || 'Errore nell\'adesione');
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setJoiningCauseId(null);
      setExpandedCauseId(null);
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

  /**
   * Mappa GoodsRequest.type → Badge variant KYKOS.
   * GOODS = bene materiale, SERVICES = servizio offerto.
   */
  function requestTypeBadge(type: string) {
    switch (type) {
      case 'GOODS': return { variant: 'primary' as const, label: 'Beni' };
      case 'SERVICES': return { variant: 'info' as const, label: 'Servizi' };
      default: return { variant: 'default' as const, label: type };
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 space-y-3">
        <Alert type="error">{error}</Alert>
        <Button
          variant="primary"
          onClick={() => { setError(null); setLoading(true); fetchRequests().finally(() => setLoading(false)); }}
        >
          Riprova
        </Button>
      </div>
    );
  }

  if (requests.length === 0 && causes.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Nessuna richiesta"
        description="Al momento non ci sono richieste disponibili."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Messages */}
      {error && (
        <Alert type="error">{error}</Alert>
      )}

      {/* Causes Section */}
      {causes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900">Cause</h2>
          </div>
          {causes.filter(c => !c.hasJoined).map((cause) => (
            <div
              key={cause.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-200"
            >
              <button
                type="button"
                onClick={() => setExpandedCauseId(expandedCauseId === cause.id ? null : cause.id)}
                className="w-full text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
                aria-expanded={expandedCauseId === cause.id}
                aria-label={`${expandedCauseId === cause.id ? 'Comprimi' : 'Espandi'} causa ${cause.title}`}
              >
                <div className="flex gap-4 p-4">
                  <div className="w-24 h-24 flex-shrink-0 bg-rose-50 rounded-lg overflow-hidden flex items-center justify-center">
                    {cause.imageUrls && cause.imageUrls.length > 0 ? (
                      <img src={cause.imageUrls[0]} alt={cause.title} className="w-full h-full object-cover" />
                    ) : (
                      <Heart className="h-10 w-10 text-rose-400" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{cause.title}</h3>
                    <p className="text-sm text-gray-500">{cause.organization.name}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{cause.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{cause.participantCount} partecipanti</span>
                      {cause.targetQty && <span>Target: {cause.targetQty}</span>}
                      {cause.deadline && <span>Scade: {new Date(cause.deadline).toLocaleDateString('it-IT')}</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center">
                    <ChevronDown
                      className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${expandedCauseId === cause.id ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </button>

              {expandedCauseId === cause.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <Alert type="warning" className="mb-4">
                    <span className="font-medium">Come aderire:</span> Segui le istruzioni nella descrizione per partecipare a questa causa.
                  </Alert>
                  {cause.description && (
                    <p className="text-gray-600 mb-4 whitespace-pre-wrap">{cause.description}</p>
                  )}
                  <ConfirmDialog
                    title="Conferma adesione"
                    message={`Vuoi aderire alla causa "${cause.title}"?`}
                    confirmLabel="Sì, aderisco"
                    variant="warning"
                    onConfirm={() => handleJoinCause(cause.id)}
                  >
                    <Button
                      variant="primary"
                      disabled={joiningCauseId === cause.id}
                      className="w-full"
                    >
                      <Heart className="h-4 w-4 mr-1" aria-hidden="true" />
                      {joiningCauseId === cause.id ? 'Iscrizione...' : 'Aderisci alla causa'}
                    </Button>
                  </ConfirmDialog>
                </div>
              )}
            </div>
          ))}
          {causes.filter(c => c.hasJoined).map((cause) => (
            <div
              key={cause.id}
              className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-4 flex items-center gap-4"
            >
              <Check className="h-5 w-5 text-green-700" aria-hidden="true" />
              <div className="flex-1">
                <h3 className="font-medium text-green-800">{cause.title}</h3>
                <p className="text-sm text-green-600">Iscritto il {new Date().toLocaleDateString('it-IT')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Richieste Section */}
      {requests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-gray-700" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900">Richieste</h2>
          </div>
          {requests.map((req) => {
            const typeBadge = requestTypeBadge(req.type);
            return (
              <div
                key={req.id}
                className="bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-200"
              >
                {/* Collapsed Card */}
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                  className="w-full text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
                  aria-expanded={expandedId === req.id}
                  aria-label={`${expandedId === req.id ? 'Comprimi' : 'Espandi'} richiesta ${req.title}`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        req.type === 'SERVICES' ? 'bg-purple-100' : 'bg-primary-100'
                      }`}>
                        {req.type === 'SERVICES' ? (
                          <Briefcase className="h-6 w-6 text-purple-600" aria-hidden="true" />
                        ) : (
                          <Package className="h-6 w-6 text-primary-600" aria-hidden="true" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{req.title}</h3>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge variant={typeBadge.variant} size="sm" pill>
                            {typeBadge.label}
                          </Badge>
                          <Badge variant="default" size="sm">
                            {categoryLabels[req.category] || req.category}
                          </Badge>
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
                        <ChevronDown
                          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${expandedId === req.id ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>
                </button>

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
                  <Alert type="info" className="mb-4 text-xs">
                    <Lock className="h-4 w-4 inline mr-1" aria-hidden="true" />
                    <span className="font-medium">Anonimato:</span> La richiesta è anonima. Non puoi vedere chi l'ha fatta.
                  </Alert>

                  {/* Offer form or already offered */}
                  {req.alreadyOffered ? (
                    <Alert type="warning" className="text-center">
                      <Check className="h-4 w-4 inline mr-1" aria-hidden="true" />
                      Hai già inviato un'offerta per questa richiesta
                    </Alert>
                  ) : offeringForId === req.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={offerMessage}
                        onChange={(e) => setOfferMessage(e.target.value)}
                        placeholder="Aggiungi una descrizione del bene che offri (facoltativo)..."
                        rows={3}
                      />
                      <ImageUploader
                        onImagesChange={setOfferImages}
                        maxFiles={5}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOffer(req.id);
                          }}
                          disabled={offeringId === req.id}
                          className="flex-1"
                        >
                          {offeringId === req.id ? 'Invio...' : req.type === 'SERVICES' ? 'Offri servizio' : 'Invia offerta'}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOfferingForId(null);
                            setOfferImages([]);
                          }}
                        >
                          Annulla
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOfferingForId(req.id);
                      }}
                      className="w-full"
                    >
                      {req.type === 'SERVICES' ? 'Offri servizio' : 'Fornisci'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}

      {/* Load more trigger */}
      {hasNextPage ? (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {loadingMore && <Spinner size="md" />}
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-gray-400">
          Fine delle richieste
        </div>
      )}
    </div>
  );
}