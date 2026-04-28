'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface EntityRequest {
  id: string;
  title: string;
  category: string;
  description: string | null;
  type: string;
  status: string;
  createdAt: string;
  beneficiary: {
    id: string;
    name: string;
  };
  intermediary: {
    id: string;
    name: string;
  };
  fulfilledBy: {
    id: string;
    name: string;
  } | null;
  offers: Array<{
    id: string;
    message: string | null;
    status: string;
    createdAt: string;
    offeredBy: {
      id: string;
      name: string;
    };
  }>;
}

interface ObjectRequest {
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

type TabType = 'GOODS' | 'SERVICES' | 'AVAILABLE';

export default function RecipientEntityRequestsPage() {
  const [requests, setRequests] = useState<EntityRequest[]>([]);
  const [objectRequests, setObjectRequests] = useState<ObjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('mine');
  const [typeFilter, setTypeFilter] = useState<TabType>('GOODS');

  useEffect(() => {
    if (typeFilter === 'AVAILABLE') {
      fetchObjectRequests();
    } else {
      fetchRequests();
    }
  }, [filter, typeFilter]);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`/api/entity-requests?filter=${filter}&type=${typeFilter}`);
      const data = await res.json();
      setRequests(data.requests || []);
      setObjectRequests([]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchObjectRequests = async () => {
    try {
      const res = await fetch('/api/recipient/requests');
      const data = await res.json();
      const requests = data.requests || [];
      // Filter based on status tab
      const filtered = filter === 'mine'
        ? requests
        : filter === 'available'
        ? requests.filter((r: ObjectRequest) => r.object.status !== 'DONATED')
        : requests;
      setObjectRequests(filtered);
      setRequests([]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">In attesa</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Approvata</span>;
      case 'FULFILLED':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Soddisfatta</span>;
      case 'CANCELLED':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Cancellata</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{status}</span>;
    }
  };

  const getObjectStatusBadge = (status: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      AVAILABLE: { label: 'Disponibile', color: 'bg-green-100 text-green-700' },
      RESERVED: { label: 'In attesa', color: 'bg-amber-100 text-amber-700' },
      WITHDRAWN: { label: 'Pronto', color: 'bg-blue-100 text-blue-700' },
      DONATED: { label: 'Ritirato', color: 'bg-gray-100 text-gray-700' },
    };
    const s = labels[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2 py-1 text-xs rounded ${s.color}`}>{s.label}</span>;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      FURNITURE: '🪑', ELECTRONICS: '📱', CLOTHING: '👕', BOOKS: '📚',
      KITCHEN: '🍳', SPORTS: '⚽', TOYS: '🧸', OTHER: '📦',
    };
    return icons[category] || '📦';
  };

  const getTypeLabel = (type: string) => {
    return type === 'GOODS' ? 'Bene' : 'Servizio';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium text-gray-900">Richieste</h1>
          <p className="text-gray-500">Gestisci le tue richieste di beni, servizi e oggetti</p>
        </div>
        {typeFilter !== 'AVAILABLE' && (
          <Link
            href="/recipient/requests-entity/new"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            + Nuova richiesta
          </Link>
        )}
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 border-b border-gray-200 pb-4">
        <button
          onClick={() => setTypeFilter('GOODS')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
            typeFilter === 'GOODS' ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🪑 Beni
        </button>
        <button
          onClick={() => setTypeFilter('SERVICES')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
            typeFilter === 'SERVICES' ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🔧 Servizi
        </button>
        <button
          onClick={() => setTypeFilter('AVAILABLE')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
            typeFilter === 'AVAILABLE' ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📦 Disponibilità
        </button>
      </div>

      {/* Status Filter */}
      {typeFilter !== 'AVAILABLE' ? (
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('mine')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              filter === 'mine' ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Le mie richieste
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              filter === 'available' ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Disponibili
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              filter === 'all' ? 'bg-gray-200 text-gray-800 border border-gray-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tutte
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('mine')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              filter === 'mine' ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Le mie richieste
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              filter === 'all' ? 'bg-gray-200 text-gray-800 border border-gray-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tutte
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Caricamento...</p>
        </div>
      ) : typeFilter === 'AVAILABLE' ? (
        // Available objects (from Request table)
        objectRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <span className="text-5xl mb-4 block">📦</span>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessuna richiesta di oggetto</h2>
            <p className="text-gray-500">
              {filter === 'mine' ? 'Non hai ancora richiesto nessun oggetto.' : 'Non ci sono richieste.'}
            </p>
            {filter === 'mine' && (
              <Link
                href="/recipient/dashboard"
                className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Sfoglia gli oggetti disponibili
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {objectRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white p-4 rounded-xl shadow-sm border-2 border-gray-200 hover:border-primary-300 transition"
              >
                <div className="flex gap-4">
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {request.object.imageUrls && request.object.imageUrls.length > 0 ? (
                      <img src={request.object.imageUrls[0]} alt={request.object.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{request.object.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Richiesta il {new Date(request.createdAt).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      {getObjectStatusBadge(request.object.status)}
                    </div>
                    {request.object.depositLocation && (
                      <p className="text-xs text-gray-400 mt-1">📍 {request.object.depositLocation}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <span className="text-5xl mb-4 block">📋</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessuna richiesta</h2>
          <p className="text-gray-500">
            {filter === 'mine' ? 'Non hai ancora creato richieste.' : 'Non ci sono richieste disponibili.'}
          </p>
          {filter === 'mine' && (
            <Link
              href="/recipient/requests-entity/new"
              className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Crea la tua prima richiesta
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Link
              key={request.id}
              href={`/recipient/requests-entity/${request.id}`}
              className="bg-white p-4 rounded-xl shadow-sm border-2 border-gray-200 hover:border-primary-300 transition"
            >
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                  {getCategoryIcon(request.category)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{request.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${request.type === 'GOODS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {getTypeLabel(request.type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {filter === 'available' ? `Da ${request.beneficiary.name}` : ''} • {formatDate(request.createdAt)}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  {request.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{request.description}</p>
                  )}
                  {request.offers.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">{request.offers.length} offerta(e)</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}