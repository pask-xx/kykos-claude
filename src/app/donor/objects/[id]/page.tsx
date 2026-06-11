'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Package, QrCode } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { REQUEST_STATUS_LABELS } from '@/types';

interface ObjectDetails {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  status: string;
  imageUrls: string[];
  createdAt: string;
  depositLocation: string | null;
  // Anonymity fix (Fase 34.1): rimossa `recipient: { name: string }`
  // perché /api/donor/objects/[id] non la restituisce più (Regola #1
  // KYKOS). Vedi 04-anonymity.md regola A4.
  requests: Array<{
    id: string;
    status: string;
    createdAt: string;
  }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  FURNITURE: 'Arredamento',
  ELECTRONICS: 'Elettronica',
  CLOTHING: 'Abbigliamento',
  BOOKS: 'Libri',
  KITCHEN: 'Cucina',
  SPORTS: 'Sport',
  TOYS: 'Giocattoli',
  OTHER: 'Altro',
};

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'Nuovo',
  LIKE_NEW: 'Come nuovo',
  GOOD: 'Buono',
  FAIR: 'Discreto',
  POOR: 'Usurato',
};

export default function DonorObjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const objectId = params.id as string;

  const [object, setObject] = useState<ObjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchObject();
  }, [objectId]);

  const fetchObject = async () => {
    try {
      const res = await fetch(`/api/donor/objects/${objectId}`);
      if (res.ok) {
        const data = await res.json();
        setObject(data.object);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    setError('');
    try {
      const res = await fetch(`/api/donor/objects/${objectId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/donor/objects');
      } else {
        const data = await res.json();
        setError(data.error || 'Errore nella cancellazione');
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2 py-1 bg-success-100 text-success-700 text-xs rounded">Disponibile</span>;
      case 'RESERVED':
        return <span className="px-2 py-1 bg-warning-100 text-warning-700 text-xs rounded">Riservata</span>;
      case 'DONATED':
        return <span className="px-2 py-1 bg-info-100 text-info-700 text-xs rounded">Ritirato</span>;
      case 'DEPOSITED':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Depositato</span>;
      case 'CANCELLED':
        return <span className="px-2 py-1 bg-error-100 text-error-700 text-xs rounded">Cancellato</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{status}</span>;
    }
  };

  const canDelete = object && ['AVAILABLE'].includes(object.status);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!object) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
          <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Oggetto non trovato</h2>
          <Link href="/donor/objects" className="text-primary-600 hover:text-primary-700 font-medium">
            ← Torna alle disponibilità
          </Link>
        </div>
      </div>
    );
  }

  const images = object.imageUrls && object.imageUrls.length > 0 ? object.imageUrls : [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm mb-4 inline-block">
        ← Indietro
      </button>

      {error && (
        <div className="mb-4 p-4 bg-error-50 border border-error-200 text-error-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Image Gallery */}
        <div className="relative">
          {images.length > 0 ? (
            <>
              <div className="aspect-video bg-gray-100">
                <img
                  src={images[currentImageIndex]}
                  alt={`${object.title} - Immagine ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
              {images.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {images.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                        index === currentImageIndex ? 'border-primary-500' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              <Package className="w-16 h-16 text-gray-400" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg font-medium">
              {CATEGORY_LABELS[object.category] || object.category}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg font-medium">
              {CONDITION_LABELS[object.condition] || object.condition}
            </span>
            {getStatusBadge(object.status)}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{object.title}</h1>

          {object.description && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Descrizione</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{object.description}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Data pubblicazione</p>
              <p className="font-medium text-gray-900">
                {new Date(object.createdAt).toLocaleDateString('it-IT')}
              </p>
            </div>
            {object.depositLocation && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Posizione deposito</p>
                <p className="font-medium text-gray-900">{object.depositLocation}</p>
              </div>
            )}
          </div>

          {/* Requests */}
          {object.requests.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Richieste ({object.requests.length})</h2>
              <div className="space-y-2">
                {object.requests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Richiedente</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      req.status === 'PENDING' ? 'bg-warning-100 text-warning-700' :
                      req.status === 'APPROVED' ? 'bg-success-100 text-success-700' :
                      req.status === 'REJECTED' ? 'bg-error-100 text-error-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {REQUEST_STATUS_LABELS[req.status as keyof typeof REQUEST_STATUS_LABELS] ?? req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QR Code for delivery */}
          {['RESERVED', 'DEPOSITED'].includes(object.status) && object.requests.length > 0 && (
            <div className="mb-6 border-t pt-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">QR Code per la consegna</h2>
              <p className="text-sm text-gray-500 mb-4">
                Usa questo QR code per consegnare l'oggetto all'ente. Mostralo quando arrivi con la donazione.
              </p>
              <div className="flex gap-3">
                <a
                  href={`/donor/delivery-qr/${object.requests[0].id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                >
                  <QrCode className="w-4 h-4" aria-hidden="true" />
                  Visualizza QR Code
                </a>
              </div>
            </div>
          )}

          {/* Actions */}
          {canDelete && (
            <div className="border-t pt-6">
              <ConfirmDialog
                title="Cancella disponibilità"
                message="Sei sicuro di voler cancellare questa disponibilità? L'azione non può essere annullata."
                confirmLabel="Sì, cancella"
                variant="danger"
                onConfirm={handleCancel}
              >
                <button
                  disabled={cancelling}
                  className="px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? 'Cancellazione...' : 'Cancella disponibilità'}
                </button>
              </ConfirmDialog>
            </div>
          )}

          {!canDelete && (
            <div className="border-t pt-6">
              <p className="text-gray-500 text-sm">
                Questa disponibilità non può essere cancellata perché è già stata processata o consegnata.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}