'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { ClipboardList, Inbox, Package } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { Badge, Button, EmptyState, Spinner } from '@/components/ui';

interface Request {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  object: {
    title: string;
    imageUrls: string[] | null;
    donor: { nickname: string | null; name: string };
  };
  recipient: { nickname: string | null; name: string; firstName: string | null; lastName: string | null };
}

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
      toast.error('Errore di connessione');
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
  const otherRequests = requests.filter((r) => r.status !== 'PENDING');

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestione richieste</h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Nessuna richiesta"
            description="Non ci sono richieste da gestire."
          />
        ) : (
          <>
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="h-5 w-5 text-amber-600" aria-hidden="true" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Richieste in attesa ({pendingRequests.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {pendingRequests.map((req) => {
                    const statusBadge = requestStatusBadge(req.status);
                    return (
                      <div key={req.id} className="bg-white p-3 rounded-xl shadow-sm border-2 border-amber-200">
                        <div className="grid grid-cols-8 gap-2 items-center">
                          {/* 1: foto + nome oggetto + status */}
                          <div className="flex items-center gap-2 col-span-2">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {req.object.imageUrls && req.object.imageUrls[0] ? (
                                <img src={req.object.imageUrls[0]} alt={req.object.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-xs truncate">{req.object.title}</p>
                              <Badge variant={statusBadge.variant} size="sm">
                                {statusBadge.label}
                              </Badge>
                            </div>
                          </div>

                          {/* 2: Beneficiario */}
                          <div>
                            <p className="text-xs text-gray-500">Beneficiario</p>
                            <p className="font-medium text-gray-900 text-xs truncate">
                              {req.recipient.nickname || req.recipient.name}
                            </p>
                          </div>

                          {/* 3: Donatore */}
                          <div>
                            <p className="text-xs text-gray-500">Donatore</p>
                            <p className="font-medium text-gray-900 text-xs truncate">
                              {req.object.donor.nickname || req.object.donor.name}
                            </p>
                          </div>

                          {/* 4: Data */}
                          <div>
                            <p className="text-xs text-gray-500">Data</p>
                            <p className="font-medium text-gray-900 text-xs">{formatDate(req.createdAt)}</p>
                          </div>

                          {/* 5: Rifiuta */}
                          <div className="flex justify-center">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleAction(req.id, 'reject')}
                              disabled={processing === req.id}
                            >
                              Rifiuta
                            </Button>
                          </div>

                          {/* 6: Approva */}
                          <div className="flex justify-center">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleAction(req.id, 'approve')}
                              disabled={processing === req.id}
                            >
                              {processing === req.id ? '...' : 'Approva'}
                            </Button>
                          </div>
                        </div>
                        {req.message && (
                          <p className="text-xs text-gray-500 mt-2 truncate">
                            <span className="font-medium">Msg:</span> {req.message}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Other Requests */}
            {otherRequests.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Richieste elaborate
                </h2>
                <div className="space-y-3">
                  {otherRequests.map((req) => {
                    const statusBadge = requestStatusBadge(req.status);
                    return (
                      <div key={req.id} className="bg-white p-3 rounded-xl shadow-sm border">
                        <div className="grid grid-cols-8 gap-2 items-center">
                          {/* 1: foto + nome oggetto + status */}
                          <div className="flex items-center gap-2 col-span-2">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {req.object.imageUrls && req.object.imageUrls[0] ? (
                                <img src={req.object.imageUrls[0]} alt={req.object.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-xs truncate">{req.object.title}</p>
                              <Badge variant={statusBadge.variant} size="sm">
                                {statusBadge.label}
                              </Badge>
                            </div>
                          </div>

                          {/* 2: Beneficiario */}
                          <div>
                            <p className="text-xs text-gray-500">Beneficiario</p>
                            <p className="font-medium text-gray-900 text-xs truncate">
                              {req.recipient.nickname || req.recipient.name}
                            </p>
                          </div>

                          {/* 3: Donatore */}
                          <div>
                            <p className="text-xs text-gray-500">Donatore</p>
                            <p className="font-medium text-gray-900 text-xs truncate">
                              {req.object.donor.nickname || req.object.donor.name}
                            </p>
                          </div>

                          {/* 4: Data */}
                          <div>
                            <p className="text-xs text-gray-500">Data</p>
                            <p className="font-medium text-gray-900 text-xs">{formatDate(req.createdAt)}</p>
                          </div>

                          {/* 5-6: empty */}
                          <div />
                          <div />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
