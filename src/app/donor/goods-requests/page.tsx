'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
  };
}

export default function DonorGoodsRequestsPage() {
  const [offers, setOffers] = useState<GoodsOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await fetch('/api/donor/goods-offers');
      if (res.ok) {
        const data = await res.json();
        setOffers(data.offers || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      FURNITURE: '🪑', ELECTRONICS: '📱', CLOTHING: '👕', BOOKS: '📚',
      KITCHEN: '🍳', SPORTS: '⚽', TOYS: '🧸', OTHER: '📦',
    };
    return icons[category] || '📦';
  };

  const acceptedOffers = offers.filter(o => o.status === 'ACCEPTED');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Richieste accettate</h1>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Caricamento...</p>
        </div>
      ) : acceptedOffers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
          <span className="text-5xl mb-4 block">📋</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessuna richiesta accettata</h2>
          <p className="text-gray-500 mb-6">Non hai ancora accettato richieste di beni da donare.</p>
          <Link href="/donor/dashboard" className="text-primary-600 hover:text-primary-700 font-medium">
            Vedi le richieste →
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {acceptedOffers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-xl shadow-sm border border-green-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                    {getCategoryIcon(offer.request.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{offer.request.title}</h3>
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
              <div className="bg-green-50 px-4 py-3 border-t border-green-100">
                <Link
                  href={`/donor/qr-goods/${offer.requestId}`}
                  className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                >
                  📱 Vedi QR Code per consegna
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}