'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Send, Inbox } from 'lucide-react';
import { CATEGORY_LABELS, CONDITION_LABELS, REQUEST_STATUS_LABELS, DonorLevel, RequestStatus, Condition } from '@/types';
import { toast } from '@/components/ui/Toast';
import { Alert, Badge, Button, EmptyState, Input, Select, Spinner } from '@/components/ui';
import ConfirmDialog from '@/components/ConfirmDialog';

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

  const handleRequest = async (objectId: string) => {
    setRequesting(objectId);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectId, message: '' }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Errore nella richiesta');
        return;
      }

      toast.success('Richiesta inviata con successo!');
      fetchObjects();
      fetchUserRequests();
    } catch {
      toast.error('Errore di connessione');
    } finally {
      setRequesting(null);
    }
  };

  const handleCancelRequest = async (objectId: string) => {
    const request = userRequests.get(objectId);
    if (!request) return;

    try {
      const res = await fetch(`/api/requests?id=${request.id}`, {
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

  const categoryOptions = [
    { value: 'ALL', label: 'Tutte' },
    ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
  ];

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

        <div className="bg-white p-4 rounded-xl shadow-sm border mb-8">
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
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : objects.length === 0 ? (
          <EmptyState
            icon={category === 'ALL' ? Inbox : Package}
            title="Nessun oggetto disponibile"
            description="Al momento non ci sono oggetti in questa categoria."
          />
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {objects
              .filter(obj => !search || obj.title.toLowerCase().includes(search.toLowerCase()))
              .map((obj) => {
                const userReq = userRequests.get(obj.id);
                const statusBadge = userReq ? requestStatusBadge(userReq.status) : null;
                return (
                  <div key={obj.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition">
                    <Link href={`/recipient/objects/${obj.id}`} className="block">
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        {obj.imageUrls && obj.imageUrls[0] ? (
                          <img src={obj.imageUrls[0]} alt={obj.title} className="object-cover w-full h-full" />
                        ) : (
                          <Package className="h-16 w-16 text-gray-400" aria-hidden="true" />
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="default" size="sm">
                            {CATEGORY_LABELS[obj.category as keyof typeof CATEGORY_LABELS] || obj.category}
                          </Badge>
                          <Badge variant="default" size="sm">
                            {CONDITION_LABELS[obj.condition as Condition] || obj.condition}
                          </Badge>
                          {statusBadge && (
                            <Badge variant={statusBadge.variant} size="sm">
                              {statusBadge.label}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{obj.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                          {obj.description || 'Nessuna descrizione'}
                        </p>
                        <p className="text-xs text-gray-400 mb-3">
                          Ente: {obj.intermediary.name}
                        </p>
                      </div>
                    </Link>
                    <div className="px-4 pb-4">
                      {userReq ? (
                        userReq.status === 'PENDING' ? (
                          <Button
                            variant="warning"
                            onClick={() => handleCancelRequest(obj.id)}
                            className="w-full"
                            size="sm"
                          >
                            Annulla richiesta
                          </Button>
                        ) : (
                          <Button
                            disabled
                            variant={
                              userReq.status === 'APPROVED' ? 'success' :
                              userReq.status === 'REJECTED' ? 'danger' :
                              'secondary'
                            }
                            className="w-full"
                            size="sm"
                          >
                            {userReq.status === 'APPROVED' ? 'Approvata!' :
                             userReq.status === 'REJECTED' ? 'Rifiutata' : 'Già richiesto'}
                          </Button>
                        )
                      ) : (
                        <ConfirmDialog
                          title="Conferma richiesta"
                          message="Sei sicuro di voler richiedere questo oggetto?"
                          confirmLabel="Sì, richiedi"
                          variant="warning"
                          onConfirm={() => handleRequest(obj.id)}
                        >
                          <Button
                            variant="primary"
                            disabled={requesting === obj.id || !user?.authorized}
                            className="w-full"
                            size="sm"
                            title={!user?.authorized ? 'Devi essere autorizzato per richiedere oggetti' : undefined}
                          >
                            <Send className="h-4 w-4 mr-1" aria-hidden="true" />
                            {requesting === obj.id ? 'Invio...' : 'Richiedi'}
                          </Button>
                        </ConfirmDialog>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </main>
    </div>
  );
}
