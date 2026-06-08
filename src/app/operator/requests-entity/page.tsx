'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Armchair, Smartphone, Shirt, Book, CookingPot, Trophy, Baby, Box,
  Wrench, ClipboardList, type LucideIcon,
} from 'lucide-react';
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
    nickname: string | null;
    name: string;
  };
  intermediary: {
    id: string;
    name: string;
  };
  fulfilledBy: {
    id: string;
    nickname: string | null;
    name: string;
  } | null;
  offers: Array<{
    id: string;
    message: string | null;
    status: string;
    createdAt: string;
    offeredBy: {
      id: string;
      nickname: string | null;
      name: string;
    };
  }>;
}

export default function OperatorEntityRequestsPage() {
  const [requests, setRequests] = useState<EntityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/operator/requests-entity');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
    if (filter === 'pending') return r.status === 'PENDING';
    if (filter === 'approved') return r.status === 'APPROVED';
    if (filter === 'fulfilled') return r.status === 'FULFILLED';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 bg-warning-100 text-warning-700 text-xs rounded">In attesa</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 bg-success-100 text-success-700 text-xs rounded">Approvata</span>;
      case 'FULFILLED':
        return <span className="px-2 py-1 bg-info-100 text-info-700 text-xs rounded">Soddisfatta</span>;
      case 'DELIVERED':
        return <span className="px-2 py-1 bg-secondary-100 text-secondary-700 text-xs rounded">Consegnata</span>;
      case 'COMPLETED':
        return <span className="px-2 py-1 bg-success-100 text-success-700 text-xs rounded">Completata</span>;
      case 'CANCELLED':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Cancellata</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{status}</span>;
    }
  };

  const getCategoryIcon = (category: string): LucideIcon => {
    const icons: Record<string, LucideIcon> = {
      FURNITURE: Armchair,
      ELECTRONICS: Smartphone,
      CLOTHING: Shirt,
      BOOKS: Book,
      KITCHEN: CookingPot,
      SPORTS: Trophy,
      TOYS: Baby,
      OTHER: Box,
    };
    return icons[category] || Box;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium text-gray-900">Richieste</h1>
        <p className="text-gray-500">Gestisci le richieste di beni e servizi</p>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 border-b border-gray-200 pb-4">
        <button
          onClick={() => setTypeFilter('ALL')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
            typeFilter === 'ALL' ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tutti
        </button>
        <button
          onClick={() => setTypeFilter('GOODS')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
            typeFilter === 'GOODS' ? 'bg-info-100 text-info-700 border border-info-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Armchair className="w-4 h-4" aria-hidden="true" />
          Beni
        </button>
        <button
          onClick={() => setTypeFilter('SERVICES')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
            typeFilter === 'SERVICES' ? 'bg-secondary-100 text-secondary-700 border border-secondary-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Wrench className="w-4 h-4" aria-hidden="true" />
          Servizi
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
            filter === 'pending' ? 'bg-warning-100 text-warning-700 border border-warning-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          In attesa ({requests.filter(r => r.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
            filter === 'approved' ? 'bg-success-100 text-success-700 border border-success-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Approvate ({requests.filter(r => r.status === 'APPROVED').length})
        </button>
        <button
          onClick={() => setFilter('fulfilled')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
            filter === 'fulfilled' ? 'bg-info-100 text-info-700 border border-info-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Soddisfatte ({requests.filter(r => r.status === 'FULFILLED').length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
            filter === 'all' ? 'bg-gray-200 text-gray-800 border border-gray-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tutte ({requests.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Caricamento...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-400" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessuna richiesta</h2>
          <p className="text-gray-500">
            {filter === 'pending' ? 'Non ci sono richieste da gestire.' : 'Non ci sono richieste.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Link
              key={request.id}
              href={`/operator/requests-entity/${request.id}`}
              className="bg-white p-4 rounded-xl shadow-sm border-2 border-gray-200 hover:border-primary-300 transition block"
            >
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {(() => {
                    const Icon = getCategoryIcon(request.category);
                    return <Icon className="w-8 h-8 text-gray-700" aria-hidden="true" />;
                  })()}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{request.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${request.type === 'GOODS' ? 'bg-info-100 text-info-700' : 'bg-secondary-100 text-secondary-700'}`}>
                          {request.type === 'GOODS' ? 'Bene' : 'Servizio'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Richiesta da {request.beneficiary.nickname || request.beneficiary.name} • {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                      {request.offers.length > 0 && (
                        <span className="px-2 py-0.5 bg-info-50 text-info-700 text-xs rounded">
                          {request.offers.length} offerte
                        </span>
                      )}
                    </div>
                  </div>
                  {request.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{request.description}</p>
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