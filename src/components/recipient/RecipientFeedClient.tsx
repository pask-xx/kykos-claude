'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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
  const [objects, setObjects] = useState<Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string; index: number } | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<string | null>(null);

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
    fetchObjects().finally(() => setLoading(false));
  }, [fetchObjects]);

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
      // User has reached the end, start polling for new items
      refreshIntervalRef.current = setInterval(() => {
        // Fetch first page to check for new items (without cursor)
        fetch('/api/recipient/objects?limit=1')
          .then(res => res.json())
          .then(data => {
            if (data.objects.length > 0 && data.objects[0].id !== lastFetchRef.current) {
              // New items available, reload all silently
              fetchObjects(null, true);
            }
          })
          .catch(() => {});
      }, 30000); // Check every 30 seconds

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [hasNextPage, objects.length, fetchObjects]);

  const handleRequest = async (objectId: string) => {
    setRequestingId(objectId);
    setError(null);
    setRequestSuccess(null);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectId }),
      });

      if (res.ok) {
        setRequestSuccess('Richiesta inviata con successo!');
        setExpandedId(null);
        setObjects(prev => prev.filter(o => o.id !== objectId));
        setTimeout(() => setRequestSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Errore nella richiesta');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setRequestingId(null);
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

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>{error}</p>
        <button
          onClick={() => { setError(null); setLoading(true); fetchObjects().finally(() => setLoading(false)); }}
          className="mt-2 text-sm text-primary-600 hover:underline"
        >
          Riprova
        </button>
      </div>
    );
  }

  if (objects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📦</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna disponibilità</h3>
        <p className="text-gray-500">Al momento non ci sono oggetti disponibili nel tuo ente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success/Error Messages */}
      {requestSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-center">
          {requestSuccess}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
          {error}
        </div>
      )}

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
                    {categoryLabels[obj.category] || obj.category}
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

              {/* Request Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRequest(obj.id);
                }}
                disabled={requestingId === obj.id}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestingId === obj.id ? 'Invio...' : 'Richiedi'}
              </button>
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
          Fine delle disponibilità
        </div>
      )}

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setSelectedImage(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
          >
            ✕
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {selectedImage.index + 1}
          </div>

          {/* Main image */}
          <img
            src={selectedImage.url}
            alt={selectedImage.title}
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Navigation arrows */}
          {selectedImage.index > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Navigate to previous image - find the object first
                const currentObj = objects.find(o => o.imageUrls.includes(selectedImage.url));
                if (currentObj) {
                  const newIndex = selectedImage.index - 1;
                  setSelectedImage({
                    url: currentObj.imageUrls[newIndex],
                    title: selectedImage.title,
                    index: newIndex,
                  });
                }
              }}
              className="absolute left-4 w-12 h-12 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
            >
              ◀
            </button>
          )}
        </div>
      )}
    </div>
  );
}