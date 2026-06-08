'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Package, Send, Inbox, X, AlertTriangle } from 'lucide-react';
import { CATEGORY_LABELS, REQUEST_STATUS_LABELS, DonorLevel, RequestStatus, Condition, CONDITION_LABELS } from '@/types';
import { toast } from '@/components/ui/Toast';
import { Alert, Card, EmptyState, Input, Select, Spinner, Badge } from '@/components/ui';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ExpandableObjectCard, ExpandableObjectCardRequest } from '@/components/recipient/ExpandableObjectCard';

interface Object {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  imageUrls: string[] | null;
  donor: {
    donorProfile: { level: DonorLevel };
  };
  intermediary: { id: string; name: string };
  status: string;
  _count?: { requests: number };
}

interface UserRequest {
  id: string;
  objectId: string;
  status: RequestStatus;
}

interface User {
  authorized: boolean;
}

/**
 * Mappa RequestStatus → Badge variant KYKOS.
 * vedi: src/types/RequestStatus per gli stati.
 */
function requestStatusBadge(status: RequestStatus) {
  switch (status) {
    case 'PENDING': return { variant: 'warning' as const, label: REQUEST_STATUS_LABELS[status] };
    case 'APPROVED': return { variant: 'success' as const, label: REQUEST_STATUS_LABELS[status] };
    case 'REJECTED': return { variant: 'danger' as const, label: REQUEST_STATUS_LABELS[status] };
    case 'CANCELLED': return { variant: 'default' as const, label: REQUEST_STATUS_LABELS[status] };
    default: return { variant: 'default' as const, label: status };
  }
}

export default function RecipientBrowsePage() {
  const [objects, setObjects] = useState<Object[]>([]);
  const [userRequests, setUserRequests] = useState<Map<string, UserRequest>>(new Map());
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [category, setCategory] = useState('ALL');
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  // Stato espansione + lightbox (analogo a RecipientFeedClient)
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string; index: number } | null>(null);
  // Segnalazione
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportObjectId, setReportObjectId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    Promise.all([fetchUserRequests(), fetchObjects(), fetchUser()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user || null);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchUserRequests = async () => {
    try {
      const res = await fetch('/api/recipient/requests');
      const data = await res.json();
      const requests: UserRequest[] = data.requests || [];
      const requestMap = new Map<string, UserRequest>();
      requests.forEach((r) => requestMap.set(r.objectId, r));
      setUserRequests(requestMap);
    } catch (error) {
      console.error('Error fetching user requests:', error);
    }
  };

  const fetchObjects = async () => {
    try {
      const url = category === 'ALL'
        ? '/api/objects'
        : `/api/objects?category=${category}`;
      const res = await fetch(url);
      const data = await res.json();
      setObjects(data.objects || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (objectId: string, message: string) => {
    setRequesting(objectId);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectId, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Errore nella richiesta');
        return;
      }

      toast.success('Richiesta inviata con successo!');
      setExpandedId(null);
      fetchObjects();
      fetchUserRequests();
    } catch {
      toast.error('Errore di connessione');
    } finally {
      setRequesting(null);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/requests?id=${requestId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Errore annullamento richiesta');
        return;
      }

      toast.success('Richiesta annullata');
      fetchObjects();
      fetchUserRequests();
    } catch {
      toast.error('Errore di connessione');
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim() || !reportObjectId) {
      toast.error('Inserisci il motivo della segnalazione');
      return;
    }

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
        toast.error(data.error || 'Errore nella segnalazione');
      }
    } catch {
      toast.error('Errore di connessione');
    } finally {
      setReporting(false);
    }
  };

  const handleImageClick = (objectId: string, index: number) => {
    const obj = objects.find((o) => o.id === objectId);
    if (!obj?.imageUrls) return;
    setSelectedImage({ url: obj.imageUrls[index], title: obj.title, index });
  };

  const categoryOptions = [
    { value: 'ALL', label: 'Tutte' },
    ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const filteredObjects = objects.filter(
    (obj) => !search || obj.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Oggetti disponibili</h1>

        {user && !user.authorized && (
          <Alert type="warning" className="mb-6">
            <p className="font-medium">Account non ancora autorizzato</p>
            <p className="text-sm">Per poter richiedere oggetti, il tuo account deve essere approvato da un operatore.</p>
          </Alert>
        )}

        <Card variant="bordered" padding="md" className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per titolo..."
              className="flex-1"
            />
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={categoryOptions}
              className="sm:w-64"
            />
          </div>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filteredObjects.length === 0 ? (
          <EmptyState
            icon={category === 'ALL' ? Inbox : Package}
            title="Nessun oggetto disponibile"
            description={
              search
                ? `Nessun risultato per "${search}".`
                : 'Al momento non ci sono oggetti in questa categoria.'
            }
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              {filteredObjects.length} {filteredObjects.length === 1 ? 'oggetto' : 'oggetti'}
            </p>
            {filteredObjects.map((obj) => {
              const userReq = userRequests.get(obj.id);
              const statusBadge = userReq ? requestStatusBadge(userReq.status) : null;
              return (
                <div key={obj.id}>
                  <ExpandableObjectCard
                    object={{
                      id: obj.id,
                      title: obj.title,
                      description: obj.description,
                      category: obj.category,
                      condition: obj.condition,
                      imageUrls: obj.imageUrls,
                      status: obj.status,
                      createdAt: new Date().toISOString(),
                      _count: obj._count,
                    }}
                    level={obj.donor.donorProfile.level}
                    isExpanded={expandedId === obj.id}
                    onToggle={() =>
                      setExpandedId(expandedId === obj.id ? null : obj.id)
                    }
                    userRequest={userReq ?? null}
                    showRequestButton={true}
                    showReportButton={true}
                    showRequestMessageInput={true}
                    requesting={requesting === obj.id}
                    onRequest={handleRequest}
                    onCancelRequest={handleCancelRequest}
                    onReport={(id) => {
                      setReportObjectId(id);
                      setShowReportModal(true);
                    }}
                    onImageClick={handleImageClick}
                    extraInfo={
                      <p className="text-xs text-gray-500">
                        Ente: <span className="font-medium text-gray-700">{obj.intermediary.name}</span>
                      </p>
                    }
                  />
                  {/* Badge richiesta esistente in collapsed, sotto la card (opzionale) */}
                  {userReq && statusBadge && (
                    <div className="mt-2 px-1">
                      <Badge variant={statusBadge.variant} size="sm">
                        La tua richiesta: {statusBadge.label}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Lightbox modal (unico a livello di pagina) */}
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
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {selectedImage.index + 1}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
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
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" aria-hidden="true" />
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-error-500 focus:border-error-500 outline-none resize-none"
                placeholder="Descrivi il problema..."
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleReport}
                disabled={reporting}
                className="flex-1 py-2 bg-error-600 text-white font-medium rounded-lg hover:bg-error-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
