'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface Request {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  object: {
    title: string;
    imageUrls: string[] | null;
    donor: { name: string };
  };
}

export default function RecipientRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/recipient/requests');
      const data = await res.json();
      setRequests(data.requests || []);
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
      case 'REJECTED':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Rifiutata</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Le mie richieste</h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Caricamento...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
            <span className="text-5xl mb-4 block">📋</span>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessuna richiesta</h2>
            <p className="text-gray-500 mb-6">Non hai ancora richiesto oggetti.</p>
            <Link href="/recipient/objects" className="text-primary-600 hover:text-primary-700 font-medium">
              Sfoglia gli oggetti disponibili →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="bg-white p-4 rounded-xl shadow-sm border flex gap-4">
                <div className="w-24 h-24 rounded-xl flex-shrink-0 overflow-hidden border-2 border-gray-200 shadow-sm p-1 bg-gray-50">
                  {req.object.imageUrls && req.object.imageUrls[0] ? (
                    <img src={req.object.imageUrls[0]} alt={req.object.title} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span className="text-3xl">📦</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{req.object.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Richiesta il {formatDate(req.createdAt)}
                      </p>
                      {req.message && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                          Il tuo messaggio: {req.message}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
