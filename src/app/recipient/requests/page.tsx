'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, QrCode, ClipboardList } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { Alert, Badge, Button, EmptyState, Spinner, Tabs } from '@/components/ui';

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

type RequestFilter = 'all' | 'active' | 'completed';

/**
 * Mappa Request.status → Badge variant KYKOS.
 * vedi: src/types/RequestStatus.
 */
function requestStatusBadge(status: string) {
  switch (status) {
    case 'PENDING': return { variant: 'warning' as const, label: 'In attesa' };
    case 'APPROVED': return { variant: 'success' as const, label: 'Approvata' };
    case 'REJECTED': return { variant: 'danger' as const, label: 'Rifiutata' };
    case 'EXPIRED': return { variant: 'default' as const, label: 'Scaduta' };
    default: return { variant: 'default' as const, label: status };
  }
}

/**
 * Mappa Object.status → Badge variant KYKOS.
 * vedi: src/types/ObjectStatus.
 */
function objectStatusBadge(status: string) {
  switch (status) {
    case 'AVAILABLE': return { variant: 'success' as const, label: 'Disponibile' };
    case 'RESERVED': return { variant: 'warning' as const, label: 'In attesa consegna' };
    case 'DEPOSITED': return { variant: 'primary' as const, label: 'Depositata' };
    case 'DONATED': return { variant: 'default' as const, label: 'Ritirato' };
    case 'CANCELLED': return { variant: 'danger' as const, label: 'Cancellato' };
    default: return { variant: 'default' as const, label: status };
  }
}

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
  const [filter, setFilter] = useState<RequestFilter>('all');

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recipient/requests');
      if (!res.ok) throw new Error('Errore nel caricamento');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore generico';
      setError(msg);
      toast.error(msg);
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

  const activeCount = requests.filter(r => r.object.status !== 'DONATED').length;
  const completedCount = requests.filter(r => r.object.status === 'DONATED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && requests.length === 0) {
    return (
      <div className="space-y-4 py-12">
        <Alert type="error">{error}</Alert>
        <div className="text-center">
          <Button variant="primary" onClick={fetchRequests}>
            Riprova
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Le mie richieste</h1>
          <p className="text-gray-500">Stato delle tue richieste di oggetti</p>
        </div>
      </div>

      <Tabs<RequestFilter>
        value={filter}
        onChange={setFilter}
        items={[
          { value: 'all', label: 'Tutte', count: requests.length },
          { value: 'active', label: 'Attive', count: activeCount },
          { value: 'completed', label: 'Completate', count: completedCount },
        ]}
        variant="default"
        ariaLabel="Filtra richieste per stato"
      />

      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nessuna richiesta"
          description={
            filter === 'all'
              ? 'Non hai ancora richiesto nessun oggetto.'
              : `Non ci sono richieste ${filter === 'active' ? 'attive' : 'completate'}.`
          }
          action={
            filter === 'all' ? (
              <Link href="/recipient/dashboard">
                <Button variant="primary">Sfoglia gli oggetti disponibili</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const requestStatus = requestStatusBadge(request.status);
            const objStatus = objectStatusBadge(request.object.status);

            return (
              <div
                key={request.id}
                className="bg-white rounded-xl shadow-sm border w-full p-4"
              >
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
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" aria-hidden="true" />
                        </div>
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
                    <Badge variant="default" size="sm">
                      {categoryLabels[request.object.category] || request.object.category}
                    </Badge>
                    <span>•</span>
                    <span>{conditionLabels[request.object.condition]}</span>
                  </div>

                  {/* Row 3: Object Status + Action */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={objStatus.variant} size="sm">
                      {objStatus.label}
                    </Badge>
                    {request.object.status === 'DEPOSITED' && (
                      <Link href={`/recipient/qr/${request.id}`}>
                        <Button variant="success" size="sm">
                          <QrCode className="h-4 w-4 mr-1" aria-hidden="true" />
                          Ritira
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Row 4: Request message (if exists) */}
                  {request.message && (
                    <p className="text-sm text-gray-600 italic">&ldquo;{request.message}&rdquo;</p>
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
