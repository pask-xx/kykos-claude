'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ClipboardList, QrCode } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { Badge, Button, EmptyState, Spinner, Tabs } from '@/components/ui';

interface ObjectWithRequests {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  status: string;
  imageUrls: string[];
  createdAt: string;
  // Anonymity fix (Fase 34.1): rimossa `recipient: { name: string }`
  // perché /api/donor/objects?filter=requests non la restituisce
  // (Regola #1 KYKOS). Vedi 04-anonymity.md regola A4.
  requests: Array<{
    id: string;
    status: string;
    createdAt: string;
  }>;
}

interface GoodsOffer {
  id: string;
  requestId: string;
  message: string | null;
  status: string;
  createdAt: string;
  imageUrls: string[];
  // Anonymity fix (Fase 34.1): rimossa `beneficiary: { name: string }`
  // perché /api/donor/goods-offers non la restituisce più
  // (Regola #1 KYKOS). Vedi 04-anonymity.md regola A4.
  request: {
    id: string;
    title: string;
    category: string;
    status: string;
  };
}

type DonorTab = 'objects' | 'goods';

/**
 * Mappa Request.status → Badge variant KYKOS.
 * vedi: src/types/RequestStatus per gli stati.
 */
function requestStatusBadge(status: string) {
  switch (status) {
    case 'PENDING': return { variant: 'warning' as const, label: 'In attesa' };
    case 'APPROVED': return { variant: 'success' as const, label: 'Approvata' };
    case 'REJECTED': return { variant: 'danger' as const, label: 'Rifiutata' };
    case 'RESERVED': return { variant: 'info' as const, label: 'Riservata' };
    case 'DEPOSITED': return { variant: 'primary' as const, label: 'Depositata' };
    case 'DONATED': return { variant: 'default' as const, label: 'Ritirato' };
    case 'FULFILLED': return { variant: 'success' as const, label: 'Soddisfatta' };
    case 'DELIVERED': return { variant: 'success' as const, label: 'Depositata' };
    default: return { variant: 'default' as const, label: status };
  }
}

/**
 * Mappa Object.status → Badge variant (per lo stato dell'oggetto donato).
 * vedi: src/types/ObjectStatus.
 */
function objectStatusBadge(status: string) {
  switch (status) {
    case 'AVAILABLE': return { variant: 'success' as const, label: 'Disponibile' };
    case 'RESERVED': return { variant: 'info' as const, label: 'Riservata' };
    case 'DEPOSITED': return { variant: 'primary' as const, label: 'Depositata' };
    case 'DONATED': return { variant: 'default' as const, label: 'Ritirato' };
    case 'CANCELLED': return { variant: 'danger' as const, label: 'Annullata' };
    case 'BLOCKED': return { variant: 'warning' as const, label: 'Bloccata' };
    default: return { variant: 'default' as const, label: status };
  }
}

export default function DonorRequestsPage() {
  const [objects, setObjects] = useState<ObjectWithRequests[]>([]);
  const [goodsOffers, setGoodsOffers] = useState<GoodsOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DonorTab>('objects');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    let fetchedObjects: ObjectWithRequests[] = [];
    let fetchedOffers: GoodsOffer[] = [];

    try {
      const objectsRes = await fetch('/api/donor/objects?filter=requests');
      if (objectsRes.ok) {
        const text = await objectsRes.text();
        try {
          const data = JSON.parse(text);
          fetchedObjects = data.objects || [];
        } catch {
          toast.error('Risposta server non valida (oggetti)');
        }
      } else {
        const data = await objectsRes.json().catch(() => ({}));
        toast.error(data?.error || 'Errore caricamento oggetti');
      }
    } catch {
      toast.error('Errore di connessione (oggetti)');
    }

    try {
      const goodsRes = await fetch('/api/donor/goods-offers');
      if (goodsRes.ok) {
        const text = await goodsRes.text();
        try {
          const data = JSON.parse(text);
          fetchedOffers = data.offers || [];
        } catch {
          toast.error('Risposta server non valida (offerte)');
        }
      } else {
        const data = await goodsRes.json().catch(() => ({}));
        toast.error(data?.error || 'Errore caricamento offerte');
      }
    } catch {
      toast.error('Errore di connessione (offerte)');
    }

    setObjects(fetchedObjects);
    setGoodsOffers(fetchedOffers);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Le mie donazioni</h1>

        <Tabs<DonorTab>
          value={tab}
          onChange={setTab}
          items={[
            { value: 'objects', label: 'Oggetti', count: objects.length },
            { value: 'goods', label: 'Beni/Servizi', count: goodsOffers.length },
          ]}
          variant="default"
          ariaLabel="Filtra donazioni per tipo"
        />

      {tab === 'objects' && (
        objects.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nessuna donazione di oggetti"
            description="Le tue donazioni di oggetti appariranno qui."
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {objects.map((obj) => {
              const statusBadge = objectStatusBadge(obj.status);
              return (
                <div key={obj.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                  <Link href={`/donor/objects/${obj.id}`} className="block">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      {obj.imageUrls && obj.imageUrls.length > 0 ? (
                        <img src={obj.imageUrls[0]} alt={obj.title} className="object-cover w-full h-full" />
                      ) : (
                        <Package className="h-16 w-16 text-gray-400" aria-hidden="true" />
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={statusBadge.variant} size="sm">
                          {statusBadge.label}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{obj.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(obj.createdAt).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </Link>
                  {['RESERVED', 'DEPOSITED'].includes(obj.status) && obj.requests && obj.requests.length > 0 && (
                    <div className="px-4 pb-4">
                      <Link href={`/donor/delivery-qr/${obj.requests[0].id}`}>
                        <Button variant="primary" className="w-full">
                          <QrCode className="h-4 w-4 mr-1" aria-hidden="true" />
                          QR Code per consegna
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === 'goods' && (
        goodsOffers.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Nessuna donazione di beni"
            description="Le tue donazioni di beni/servizi appariranno qui."
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goodsOffers.map((offer) => {
              const statusBadge = requestStatusBadge(offer.status);
              return (
                <div key={offer.id} className="bg-white rounded-xl shadow-sm border border-success-200 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-500" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{offer.request?.title}</h3>
                        <p className="text-xs text-gray-500">
                          Accettata il {new Date(offer.createdAt).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      <Badge variant={statusBadge.variant} size="sm">
                        {statusBadge.label}
                      </Badge>
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
                    <div className="bg-success-50 px-4 py-3 border-t border-success-100">
                      <Link href={`/donor/qr-goods/${offer.requestId}`}>
                        <Button variant="success" className="w-full">
                          <QrCode className="h-4 w-4 mr-1" aria-hidden="true" />
                          Vedi QR Code per consegna
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
      </main>
    </div>
  );
}
