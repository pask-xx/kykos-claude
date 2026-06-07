'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Package, Inbox } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { Badge, Button, EmptyState, Spinner, Tabs } from '@/components/ui';

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
    status: string;
  };
  recipient: {
    id: string;
    nickname: string | null;
    name: string;
    email: string;
  };
}

type RequestTab = 'pending' | 'processed';

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

/**
 * Mappa Request.status → Badge variant KYKOS.
 * vedi: src/types/RequestStatus per i 3 stati.
 */
function requestStatusBadge(status: string) {
  switch (status) {
    case 'PENDING': return { variant: 'warning' as const, label: 'In attesa' };
    case 'APPROVED': return { variant: 'success' as const, label: 'Approvata' };
    case 'REJECTED': return { variant: 'danger' as const, label: 'Rifiutata' };
    default: return { variant: 'default' as const, label: status };
  }
}

/**
 * Mappa Object.status → Badge variant (per la richiesta dell'oggetto).
 * vedi: src/types/ObjectStatus per i 5 stati (AVAILABLE, RESERVED, DEPOSITED, DONATED, CANCELLED).
 */
function objectStatusBadge(status: string) {
  switch (status) {
    case 'RESERVED': return { variant: 'info' as const, label: 'Riservata' };
    case 'DEPOSITED': return { variant: 'primary' as const, label: 'Depositato' };
    case 'DONATED': return { variant: 'default' as const, label: 'Ritirato' };
    case 'CANCELLED': return { variant: 'danger' as const, label: 'Cancellato' };
    default: return null;
  }
}

export default function OperatorRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('status') as RequestTab) || 'pending';

  const [tab, setTab] = useState<RequestTab>(initialTab);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
    // Sincronizza URL per deep-link (sostituisce la history, no scroll)
    const url = new URL(window.location.href);
    if (tab === 'pending') {
      url.searchParams.delete('status');
    } else {
      url.searchParams.set('status', tab);
    }
    router.replace(`${url.pathname}${url.search}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/operator/requests');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Errore nel caricamento');
        return;
      }
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      toast.error('Errore di connessione');
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
        toast.success(action === 'approve' ? 'Richiesta approvata' : 'Richiesta rifiutata');
        fetchRequests();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Errore');
      }
    } catch {
      toast.error('Errore di connessione');
    } finally {
      setProcessing(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const processedRequests = requests.filter((r) => r.status !== 'PENDING');
  const displayRequests = tab === 'processed' ? processedRequests : pendingRequests;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestione richieste</h1>
        <p className="text-gray-500">Visualizza e gestisci le richieste degli utenti</p>
      </div>

      <Tabs<RequestTab>
        value={tab}
        onChange={setTab}
        items={[
          { value: 'pending', label: 'In attesa', count: pendingRequests.length },
          { value: 'processed', label: 'Elaborate', count: processedRequests.length },
        ]}
        variant="default"
        ariaLabel="Filtra richieste per stato"
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : displayRequests.length === 0 ? (
        <EmptyState
          icon={tab === 'pending' ? Inbox : Package}
          title={tab === 'pending' ? 'Nessuna richiesta in attesa' : 'Nessuna richiesta elaborata'}
          description={
            tab === 'pending'
              ? 'Tutte le richieste sono state elaborate!'
              : 'Non ci sono richieste elaborate.'
          }
        />
      ) : (
        <div className="space-y-4">
          {displayRequests.map((req) => {
            const requestStatus = requestStatusBadge(req.status);
            const objectStatus = objectStatusBadge(req.object.status);
            return (
              <div
                key={req.id}
                className={`bg-white p-4 rounded-xl shadow-sm border-2 flex flex-col gap-3 ${
                  req.status === 'PENDING' ? 'border-amber-200' : 'border-gray-200'
                }`}
              >
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
                      <Package className="h-8 w-8 text-gray-400" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{req.object.title}</h3>
                    <p className="text-xs text-gray-400">
                      Richiesta il {formatDate(req.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Row 2: Category + Condition + Object status */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Badge variant="default">
                    {categoryLabels[req.object.category] || req.object.category}
                  </Badge>
                  <span>•</span>
                  <span>{conditionLabels[req.object.condition] || req.object.condition}</span>
                  {objectStatus && <Badge variant={objectStatus.variant}>{objectStatus.label}</Badge>}
                </div>

                {/* Row 3: Beneficiary + Request status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm">
                    <span className="text-gray-500">Beneficiario: </span>
                    <span className="text-gray-700 font-medium">
                      {req.recipient.nickname || req.recipient.name}
                    </span>
                  </div>
                  <Badge variant={requestStatus.variant}>{requestStatus.label}</Badge>
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
                    <Button
                      variant="success"
                      className="flex-1"
                      onClick={() => handleAction(req.id, 'approve')}
                      disabled={processing === req.id}
                    >
                      {processing === req.id ? 'Elaborazione...' : 'Approva'}
                    </Button>
                    <Button
                      variant="danger"
                      className="flex-1"
                      onClick={() => handleAction(req.id, 'reject')}
                      disabled={processing === req.id}
                    >
                      Rifiuta
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
