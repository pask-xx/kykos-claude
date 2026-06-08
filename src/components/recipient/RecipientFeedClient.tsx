'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, ChevronDown, Check } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { CATEGORY_LABELS, Category } from '@/types';
import { toast } from '@/components/ui/Toast';
import { Alert, Button } from '@/components/ui';

interface MultiAvailability {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  imageUrls: string[];
  availableQty: number;
  assignedQty: number;
  deadline: string | null;
  createdAt: string;
  hasRequested: boolean;
  requestStatus: string | null;
  _count: { requests: number };
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

interface Object {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  imageUrls: string[];
  createdAt: string;
  donor: {
    donorProfile: { level: string } | null;
  };
  _count: { requests: number };
}

export default function RecipientFeedClient() {
  const [multiAvailabilities, setMultiAvailabilities] = useState<MultiAvailability[]>([]);
  const [objects, setObjects] = useState<Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string; index: number } | null>(null);
  const [confirmRequestId, setConfirmRequestId] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState<string>('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportObjectId, setReportObjectId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [requestingMultiId, setRequestingMultiId] = useState<string | null>(null);
  const [expandedMultiId, setExpandedMultiId] = useState<string | null>(null);
  const [causes, setCauses] = useState<Cause[]>([]);
  const [joiningCauseId, setJoiningCauseId] = useState<string | null>(null);
  const [expandedCauseId, setExpandedCauseId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<string | null>(null);

  const fetchMultiAvailabilities = useCallback(async () => {
    try {
      const res = await fetch('/api/recipient/multi-availability');
      if (res.ok) {
        const data = await res.json();
        setMultiAvailabilities(data.availabilities || []);
      }
    } catch (err) {
      console.error('Error fetching multi availabilities:', err);
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

  const fetchObjects = useCallback(async (cursor: string | null = null, silent = false) => {
    try {
      const url = cursor
        ? `/api/recipient/objects?cursor=${cursor}&limit=10`
        : '/api/recipient/objects?limit=10';

      const res = await fetch(url);
      if (!res.ok) throw new Error('Errore nel caricamento');

      const data = await res.json();

      if (cursor) {
        setObjects(prev => [...prev, ...data.objects]);
      } else {
        setObjects(data.objects);
      }

      setCursor(data.nextCursor);
      setHasNextPage(data.hasNextPage);
      lastFetchRef.current = data.objects[0]?.id || null;
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Errore generico');
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchMultiAvailabilities(),
      fetchObjects(),
      fetchCauses(),
    ]).finally(() => setLoading(false));
  }, [fetchMultiAvailabilities, fetchObjects, fetchCauses]);

  // Load more when scrolling
  useEffect(() => {
    if (!hasNextPage || !loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasNextPage) {
          setLoadingMore(true);
          fetchObjects(cursor).finally(() => setLoadingMore(false));
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasNextPage, loadingMore, cursor, fetchObjects]);

  // Auto-refresh when user reached the end and no more pages
  useEffect(() => {
    if (!hasNextPage && objects.length > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetch('/api/recipient/objects?limit=1')
          .then(res => res.json())
          .then(data => {
            if (data.objects.length > 0 && data.objects[0].id !== lastFetchRef.current) {
              fetchObjects(null, true);
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
  }, [hasNextPage, objects.length, fetchObjects]);

  const handleRequestMultiAvailability = async (multiAvailabilityId: string) => {
    setRequestingMultiId(multiAvailabilityId);
    try {
      const res = await fetch(`/api/recipient/multi-availability/${multiAvailabilityId}/requests`, {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('Richiesta inviata con successo!');
        setMultiAvailabilities(prev =>
          prev.map(a => a.id === multiAvailabilityId ? { ...a, hasRequested: true, requestStatus: 'PENDING' } : a)
        );
      } else {
        const data = await res.json();
        setError(data.error || 'Errore nella richiesta');
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setRequestingMultiId(null);
    }
  };

  const handleRequest = async (objectId: string) => {
    setRequestingId(objectId);
    setError(null);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectId, message: requestMessage }),
      });

      if (res.ok) {
        toast.success('Richiesta inviata con successo!');
        setExpandedId(null);
        setObjects(prev => prev.filter(o => o.id !== objectId));
      } else {
        const data = await res.json();
        setError(data.error || 'Errore nella richiesta');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setRequestingId(null);
      setConfirmRequestId(null);
      setRequestMessage('');
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim() || !reportObjectId) return;

    setReporting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectId: reportObjectId, reason: reportReason }),
      });

      if (res.ok) {
        setShowReportModal(false);
        setReportReason('');
        setReportObjectId(null);
        toast.success('Segnalazione inviata! Grazie per averci aiutato.');
      } else {
        const data = await res.json();
        setError(data.error || 'Errore nella segnalazione');
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setReporting(false);
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

  const conditionLabels: Record<string, string> = {
    NEW: 'Nuovo',
    LIKE_NEW: 'Come nuovo',
    GOOD: 'Buono',
    FAIR: 'Discreto',
    POOR: 'Usurato',
  };

  const levelEmoji: Record<string, string> = {
    BRONZE: '🥉',
    SILVER: '🥈',
    GOLD: '🥇',
    PLATINUM: '🏆',
    DIAMOND: '💎',
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const availableMultiAvailabilities = multiAvailabilities.filter(a => !a.hasRequested);
  const availableCauses = causes.filter(c => !c.hasJoined);
  const joinedCauses = causes.filter(c => c.hasJoined);

  return (
    <div className="space-y-4">
      {/* Error Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
          {error}
        </div>
      )}

      {/* Causes Section */}
      {causes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900">Cause</h2>
          </div>
          {availableCauses.map((cause) => (
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
                      className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${expandedCauseId === cause.id ? 'rotate-180' : ''}`}
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
                      variant="danger"
                      disabled={joiningCauseId === cause.id}
                      loading={joiningCauseId === cause.id}
                      className="w-full"
                    >
                      Aderisci alla causa
                    </Button>
                  </ConfirmDialog>
                </div>
              )}
            </div>
          ))}
          {joinedCauses.length > 0 && joinedCauses.map((cause) => (
            <div
              key={cause.id}
              className="bg-success-50 rounded-xl shadow-sm border border-success-200 p-4 flex items-center gap-4"
            >
              <Check className="h-6 w-6 text-success-700 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <h3 className="font-medium text-success-800">{cause.title}</h3>
                <p className="text-sm text-success-600">Iscritto il {new Date().toLocaleDateString('it-IT')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Multi Availabilities Section */}
      {availableMultiAvailabilities.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <h2 className="text-lg font-semibold text-gray-900">Distribuzioni disponibili</h2>
          </div>
          {availableMultiAvailabilities.map((avail) => (
            <div
              key={avail.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-200"
            >
              {/* Collapsed Card */}
              <div
                className="cursor-pointer"
                onClick={() => setExpandedMultiId(expandedMultiId === avail.id ? null : avail.id)}
              >
                <div className="flex gap-4 p-4">
                  {/* Image */}
                  <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {avail.imageUrls && avail.imageUrls.length > 0 ? (
                      <img
                        src={avail.imageUrls[0]}
                        alt={avail.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{avail.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                        {CATEGORY_LABELS[avail.category] || avail.category}
                      </span>
                    </div>
                    {avail.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{avail.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Pubblicato {new Date(avail.createdAt).toLocaleDateString('it-IT')}
                    </p>
                  </div>

                  {/* Expand icon */}
                  <div className="flex-shrink-0 flex items-center">
                    <span className={`text-gray-400 transition-transform duration-200 ${expandedMultiId === avail.id ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedMultiId === avail.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  {/* Disclaimer */}
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <span className="font-medium">Nota:</span> La disponibilità è limitata e l'assegnazione non è garantita. Riceverai una comunicazione dall'ente in caso di assegnazione o mancata assegnazione della tua richiesta.
                    </p>
                  </div>

                  {/* Description */}
                  {avail.description && (
                    <p className="text-gray-600 mb-4">{avail.description}</p>
                  )}

                  {/* Action Buttons */}
                  <div className="px-2">
                    <ConfirmDialog
                      title="Conferma richiesta"
                      message={`Vuoi richiedere "${avail.title}"? L'ente deciderà l'assegnazione in base alle esigenze.`}
                      confirmLabel="Sì, richiedi"
                      variant="warning"
                      onConfirm={() => handleRequestMultiAvailability(avail.id)}
                    >
                      <button
                        disabled={requestingMultiId === avail.id}
                        className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {requestingMultiId === avail.id ? 'Invio...' : 'Richiedi'}
                      </button>
                    </ConfirmDialog>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Regular Objects Section */}
      {objects.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎁</span>
            <h2 className="text-lg font-semibold text-gray-900">Disponibilità</h2>
          </div>
          {objects.map((obj) => (
            <div
              key={obj.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-200"
            >
              {/* Collapsed Card */}
              <div
                className="cursor-pointer"
                onClick={() => setExpandedId(expandedId === obj.id ? null : obj.id)}
              >
                <div className="flex gap-4 p-4">
                  {/* Image */}
                  <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {obj.imageUrls && obj.imageUrls.length > 0 ? (
                      <img
                        src={obj.imageUrls[0]}
                        alt={obj.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{obj.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                        {CATEGORY_LABELS[obj.category as Category] || obj.category}
                      </span>
                      {obj.donor.donorProfile?.level && (
                        <span className="text-sm">{levelEmoji[obj.donor.donorProfile.level]}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(obj.createdAt).toLocaleDateString('it-IT')}
                      {obj._count.requests > 0 && (
                        <span className="ml-2 text-amber-600">• {obj._count.requests} richiesta{obj._count.requests !== 1 ? 'e' : ''}</span>
                      )}
                    </p>
                  </div>

                  {/* Expand icon */}
                  <div className="flex-shrink-0 flex items-center">
                    <span className={`text-gray-400 transition-transform duration-200 ${expandedId === obj.id ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === obj.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  {/* Gallery */}
                  {obj.imageUrls && obj.imageUrls.length > 0 && (
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                      {obj.imageUrls.map((url, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage({ url, title: obj.title, index: i });
                          }}
                          className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg overflow-hidden"
                        >
                          <img
                            src={url}
                            alt={`${obj.title} - ${i + 1}`}
                            className="w-32 h-32 object-cover hover:opacity-90 transition-opacity"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  {obj.description && (
                    <p className="text-gray-600 mb-4">{obj.description}</p>
                  )}

                  {/* Details */}
                  <div className="flex flex-wrap gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Condizione:</span>
                      <span className="ml-1 font-medium text-gray-700">{conditionLabels[obj.condition]}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Pubblicato:</span>
                      <span className="ml-1 font-medium text-gray-700">
                        {new Date(obj.createdAt).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="mb-4">
                    <label htmlFor={`message-${obj.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                      Messaggio opzionale (presentati brevemente)
                    </label>
                    <textarea
                      id={`message-${obj.id}`}
                      value={confirmRequestId === obj.id ? requestMessage : ''}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none text-sm"
                      placeholder="Scrivi un messaggio all'ente..."
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <ConfirmDialog
                      title="Conferma richiesta"
                      message="Sei sicuro di voler richiedere questo oggetto?"
                      confirmLabel="Sì, richiedi"
                      variant="warning"
                      onConfirm={() => handleRequest(obj.id)}
                    >
                      <button
                        disabled={requestingId === obj.id}
                        className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {requestingId === obj.id ? 'Invio...' : 'Richiedi questo oggetto'}
                      </button>
                    </ConfirmDialog>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportObjectId(obj.id);
                        setShowReportModal(true);
                      }}
                      className="px-4 py-3 border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 hover:text-gray-700 transition"
                    >
                      ⚠️ Segnala
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {objects.length === 0 && availableMultiAvailabilities.length === 0 && causes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna disponibilità</h3>
          <p className="text-gray-500">Al momento non ci sono oggetti disponibili nel tuo ente.</p>
        </div>
      )}

      {/* Load more trigger */}
      {hasNextPage ? (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {loadingMore && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          )}
        </div>
      ) : objects.length > 0 && (
        <div className="text-center py-4 text-sm text-gray-400">
          Fine delle disponibilità
        </div>
      )}

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            aria-label="Chiudi galleria"
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
          >
            <span aria-hidden="true">✕</span>
          </button>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {selectedImage.index + 1}
          </div>
          <img
            src={selectedImage.url}
            alt={selectedImage.title}
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Segnala problema</h2>
              <button
                type="button"
                aria-label="Chiudi modale segnalazione"
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Segnala questo annuncio. Verrà esaminato e potrebbe essere rimosso se non rispetta le linee guida.
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
                placeholder="Descrivi il problema..."
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