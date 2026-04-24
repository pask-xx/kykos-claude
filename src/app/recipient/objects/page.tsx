'use client';

import { useState, useEffect } from 'react';
import { CATEGORY_LABELS, REQUEST_STATUS_LABELS, RequestStatus } from '@/types';

interface Object {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  imageUrls: string[] | null;
  donor: { name: string };
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

export default function RecipientBrowsePage() {
  const [objects, setObjects] = useState<Object[]>([]);
  const [userRequests, setUserRequests] = useState<Map<string, UserRequest>>(new Map());
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('ALL');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    Promise.all([fetchUserRequests(), fetchObjects(), fetchUser()]);
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
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (objectId: string) => {
    setRequesting(objectId);
    setMessage('');

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectId, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Errore nella richiesta');
        return;
      }

      setMessage('Richiesta inviata con successo!');
      fetchObjects();
      fetchUserRequests();
    } catch {
      setMessage('Errore di connessione');
    } finally {
      setRequesting(null);
    }
  };

  const handleCancelRequest = async (objectId: string) => {
    const request = userRequests.get(objectId);
    if (!request) return;

    setMessage('');
    try {
      const res = await fetch(`/api/requests?id=${request.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Errore annullamento richiesta');
        return;
      }

      setMessage('Richiesta annullata');
      fetchObjects();
      fetchUserRequests();
    } catch {
      setMessage('Errore di connessione');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-medium text-gray-900 mb-6 text-center">Oggetti disponibili</h1>

        {/* Authorization warning */}
        {user && !user.authorized && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
            <p className="font-medium">⚠️ Account non ancora autorizzato</p>
            <p className="text-sm">Per poter richiedere oggetti, il tuo account deve essere approvato da un operatore.</p>
          </div>
        )}

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('annullata') ? 'bg-amber-50 text-amber-700' : message.includes('successo') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border mb-8">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCategory('ALL')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                category === 'ALL' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tutti
            </button>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  category === key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Caricamento...</p>
          </div>
        ) : objects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
            <span className="text-5xl mb-4 block">📦</span>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessun oggetto disponibile</h2>
            <p className="text-gray-500">Al momento non ci sono oggetti in questa categoria.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {objects.map((obj) => (
              <div key={obj.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {obj.imageUrls && obj.imageUrls[0] ? (
                    <img src={obj.imageUrls[0]} alt={obj.title} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-5xl">📦</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {CATEGORY_LABELS[obj.category as keyof typeof CATEGORY_LABELS] || obj.category}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {obj.condition.replace('_', ' ')}
                    </span>
                    {userRequests.has(obj.id) && (
                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                        userRequests.get(obj.id)?.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        userRequests.get(obj.id)?.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        userRequests.get(obj.id)?.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {REQUEST_STATUS_LABELS[userRequests.get(obj.id)?.status as RequestStatus] || userRequests.get(obj.id)?.status}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{obj.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {obj.description || 'Nessuna descrizione'}
                  </p>
                  <p className="text-xs text-gray-400 mb-3">
                    Ente: {obj.intermediary.name}
                  </p>
                  {userRequests.has(obj.id) ? (
                    userRequests.get(obj.id)?.status === 'PENDING' ? (
                      <button
                        onClick={() => handleCancelRequest(obj.id)}
                        className="w-full py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium text-sm"
                      >
                        Annulla richiesta
                      </button>
                    ) : (
                      <button
                        disabled
                        className={`w-full py-2 rounded-lg font-medium text-sm disabled:opacity-75 ${
                          userRequests.get(obj.id)?.status === 'APPROVED' ? 'bg-green-600 text-white' :
                          userRequests.get(obj.id)?.status === 'REJECTED' ? 'bg-red-500 text-white' :
                          'bg-gray-400 text-white'
                        }`}
                      >
                        {userRequests.get(obj.id)?.status === 'APPROVED' ? 'Approvata!' :
                         userRequests.get(obj.id)?.status === 'REJECTED' ? 'Rifiutata' : 'Già richiesto'}
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleRequest(obj.id)}
                      disabled={requesting === obj.id || !user?.authorized}
                      className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!user?.authorized ? 'Devi essere autorizzato per richiedere oggetti' : undefined}
                    >
                      {requesting === obj.id ? 'Invio...' : 'Richiedi'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
