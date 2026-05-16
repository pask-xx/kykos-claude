'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ObjectWithRequests {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  status: string;
  imageUrls: string[];
  createdAt: string;
  requests: Array<{
    id: string;
    status: string;
    createdAt: string;
    recipient: {
      name: string;
    };
  }>;
}

interface GoodsOffer {
  id: string;
  requestId: string;
  message: string | null;
  status: string;
  createdAt: string;
  imageUrls: string[];
  request: {
    id: string;
    title: string;
    category: string;
    status: string;
    beneficiary: {
      name: string;
    };
  };
}

export default function DonorRequestsPage() {
  const [objects, setObjects] = useState<ObjectWithRequests[]>([]);
  const [goodsOffers, setGoodsOffers] = useState<GoodsOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'objects' | 'goods'>('objects');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    console.log('Fetching donor requests data...');

    let fetchedObjects: ObjectWithRequests[] = [];
    let fetchedOffers: GoodsOffer[] = [];

    try {
      console.log('Fetching objects...');
      const objectsRes = await fetch('/api/donor/objects?filter=requests');
      console.log('Objects response status:', objectsRes.status);

      if (objectsRes.ok) {
        const text = await objectsRes.text();
        console.log('Objects response text:', text.substring(0, 500));
        try {
          const data = JSON.parse(text);
          fetchedObjects = data.objects || [];
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
          fetchedOffers = data.offers || [];
        } catch (e) {
          console.error('Failed to parse goods offers JSON:', e);
        }
      }
    } catch (e) {
      console.error('Error fetching goods offers:', e);
    }

    console.log('Setting state with objects:', fetchedObjects.length, 'offers:', fetchedOffers.length);
    setObjects(fetchedObjects);
    setGoodsOffers(fetchedOffers);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">In attesa</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Approvata</span>;
      case 'RESERVED':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Riservata</span>;
      case 'DEPOSITED':
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">Depositato</span>;
      case 'DONATED':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Ritirato</span>;
      case 'FULFILLED':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Soddisfatta</span>;
      case 'DELIVERED':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Depositata</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Rifiutata</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{status}</span>;
    }
  };

  const getObjectStatusBadge = (status: string) => {
    switch (status) {
      case 'RESERVED':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">Riservata</span>;
      case 'DEPOSITED':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Depositato</span>;
      case 'DONATED':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Ritirato</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{status}</span>;
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      FURNITURE: '🪑', ELECTRONICS: '📱', CLOTHING: '👕', BOOKS: '📚',
      KITCHEN: '🍳', SPORTS: '⚽', TOYS: '🧸', OTHER: '📦',
    };
    return icons[category] || '📦';
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
          Oggetti ({objects.length})
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
        objects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
            <span className="text-5xl mb-4 block">📦</span>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessuna donazione di oggetti</h2>
            <p className="text-gray-500">Le tue donazioni di oggetti appariranno qui.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {objects.map((obj) => (
              <div key={obj.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                <Link
                  href={`/donor/objects/${obj.id}`}
                  className="block"
                >
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    {obj.imageUrls && obj.imageUrls.length > 0 ? (
                      <img src={obj.imageUrls[0]} alt={obj.title} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-5xl">📦</span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      {getObjectStatusBadge(obj.status)}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{obj.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(obj.createdAt).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </Link>
                {['RESERVED', 'DEPOSITED'].includes(obj.status) && obj.requests && obj.requests.length > 0 && (
                  <div className="px-4 pb-4">
                    <Link
                      href={`/donor/delivery-qr/${obj.requests[0].id}`}
                      className="block w-full text-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm"
                    >
                      📱 QR Code per consegna
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Goods Tab */}
      {tab === 'goods' && (
        goodsOffers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
            <span className="text-5xl mb-4 block">📋</span>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessuna donazione di beni</h2>
            <p className="text-gray-500">Le tue donazioni di beni/servizi appariranno qui.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goodsOffers.map((offer) => (
              <div key={offer.id} className="bg-white rounded-xl shadow-sm border border-green-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                      {getCategoryIcon(offer.request?.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{offer.request?.title}</h3>
                      <p className="text-xs text-gray-500">
                        Accettata il {new Date(offer.createdAt).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                  {offer.message && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{offer.message}</p>
                  )}
                  {offer.imageUrls && offer.imageUrls.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {offer.imageUrls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Immagine ${i + 1}`}
                          className="w-10 h-10 object-cover rounded border border-gray-200"
                        />
                      ))}
                    </div>
                  )}
                </div>
                {offer.status === 'ACCEPTED' && (
                  <div className="bg-green-50 px-4 py-3 border-t border-green-100">
                    <Link
                      href={`/donor/qr-goods/${offer.requestId}`}
                      className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                    >
                      📱 Vedi QR Code per consegna
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}