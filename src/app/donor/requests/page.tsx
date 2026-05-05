'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ObjectRequest {
  id: string;
  objectId: string;
  status: string;
  createdAt: string;
  object: {
    id: string;
    title: string;
    imageUrls: string[];
    status: string;
  };
  recipient: {
    name: string;
  };
}

interface GoodsOffer {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  request: {
    id: string;
    beneficiary: {
      name: string;
    };
  };
}

export default function DonorRequestsPage() {
  const [objectRequests, setObjectRequests] = useState<ObjectRequest[]>([]);
  const [goodsOffers, setGoodsOffers] = useState<GoodsOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'objects' | 'goods'>('objects');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    console.log('Fetching donor requests data...');

    let objects = [];
    let offers = [];

    try {
      console.log('Fetching objects...');
      const objectsRes = await fetch('/api/donor/objects?filter=requests');
      console.log('Objects response status:', objectsRes.status);

      if (objectsRes.ok) {
        const text = await objectsRes.text();
        console.log('Objects response text:', text.substring(0, 500));
        try {
          const data = JSON.parse(text);
          objects = data.objects || [];
        } catch (e) {
          console.error('Failed to parse objects JSON:', e);
        }
      }
    } catch (e) {
      console.error('Error fetching objects:', e);
    }

    try {
      console.log('Fetching goods offers...');
      const goodsRes = await fetch('/api/donor/goods-offers');
      console.log('Goods offers response status:', goodsRes.status);

      if (goodsRes.ok) {
        const text = await goodsRes.text();
        console.log('Goods offers response text:', text.substring(0, 500));
        try {
          const data = JSON.parse(text);
          offers = data.offers || [];
        } catch (e) {
          console.error('Failed to parse goods offers JSON:', e);
        }
      }
    } catch (e) {
      console.error('Error fetching goods offers:', e);
    }

    console.log('Setting state with objects:', objects.length, 'offers:', offers.length);
    setObjectRequests(objects);
    setGoodsOffers(offers);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">In attesa</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Approvata</span>;
      case 'RESERVED':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Riservato</span>;
      case 'DEPOSITED':
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">Depositato</span>;
      case 'DONATED':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Donato</span>;
      case 'FULFILLED':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Soddisfatta</span>;
      case 'DELIVERED':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Consegnato</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Rifiutata</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{status}</span>;
    }
  };

  const getObjectStatusBadge = (status: string) => {
    switch (status) {
      case 'RESERVED':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">Riservato</span>;
      case 'DEPOSITED':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Depositato</span>;
      case 'DONATED':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Donato</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Le mie donazioni</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4">
        <button
          onClick={() => setTab('objects')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
            tab === 'objects' ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Oggetti ({objectRequests.length})
        </button>
        <button
          onClick={() => setTab('goods')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
            tab === 'goods' ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Beni/Servizi ({goodsOffers.length})
        </button>
      </div>

      {/* Objects Tab */}
      {tab === 'objects' && (
        objectRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
            <span className="text-5xl mb-4 block">📦</span>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessuna donazione di oggetti</h2>
            <p className="text-gray-500">Le tue donazioni di oggetti appariranno qui.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {objectRequests.map((req) => (
              <Link
                key={req.id}
                href={`/donor/objects/${req.object.id}`}
                className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  {req.object.imageUrls && req.object.imageUrls.length > 0 ? (
                    <img src={req.object.imageUrls[0]} alt={req.object.title} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-5xl">📦</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    {getObjectStatusBadge(req.object.status)}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{req.object.title}</h3>
                  <p className="text-sm text-gray-500">
                    Richiesta da {req.recipient.name} • {new Date(req.createdAt).toLocaleDateString('it-IT')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {/* Goods Tab */}
      {tab === 'goods' && (
        goodsOffers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
            <span className="text-5xl mb-4 block">🎁</span>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessuna donazione di beni</h2>
            <p className="text-gray-500">Le tue donazioni di beni/servizi appariranno qui.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goodsOffers.map((offer) => (
              <div key={offer.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    {getStatusBadge(offer.status)}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{offer.title}</h3>
                  <p className="text-sm text-gray-500">
                    Per {offer.request.beneficiary.name} • {new Date(offer.createdAt).toLocaleDateString('it-IT')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}