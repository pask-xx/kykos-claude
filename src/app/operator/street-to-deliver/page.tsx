'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QrCode, PartyPopper, Package, Gift } from 'lucide-react';
import { CATEGORY_LABELS } from '@/types';
import { Button, toast } from '@/components/ui';
import { QrDialog, type QrDialogItem } from '@/components/qr/QrDialog';

interface EntityInfo {
  id: string;
  name: string;
  address: string | null;
  houseNumber: string | null;
  cap: string | null;
  city: string | null;
  province: string | null;
  hoursInfo: string | null;
}

interface StreetDeliveryItem {
  id: string;
  type: 'OBJECT' | 'GOODS';
  title: string;
  category: string;
  status: string;
  statusLabel: string;
  imageUrls: string[];
  depositLocation?: string | null;
  objectId?: string;
  goodsRequestId?: string;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryNickname: string | null;
  beneficiaryAddress: string | null;
  createdAt: string;
  qrData: string;
  qrImageUrl?: string;
  entity: EntityInfo;
}

const TYPE_STYLES: Record<
  string,
  { border: string; badge: string; Icon: typeof Package }
> = {
  OBJECT: { border: 'border-l-green-500', badge: 'bg-green-100 text-green-700', Icon: Package },
  GOODS: { border: 'border-l-purple-500', badge: 'bg-purple-100 text-purple-700', Icon: Gift },
};

export default function StreetToDeliverPage() {
  const router = useRouter();
  const [items, setItems] = useState<StreetDeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<QrDialogItem | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/operator/street-to-deliver');
      if (!res.ok) throw new Error('Errore nel caricamento');
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore di rete');
    } finally {
      setLoading(false);
    }
  };

  const openQRDialog = (item: StreetDeliveryItem) => {
    setSelectedItem(toQrDialogItem(item));
    setShowQRDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-[3px] border-primary-600 border-b-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Caricamento...</p>
        </div>
      </div>
    );
  }

  const totalItems = items.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                type="button"
                onClick={() => router.back()}
                className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-flex items-center gap-1"
              >
                ← Indietro
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Ritiri</h1>
              <p className="text-gray-500 text-sm mt-1">
                {totalItems} elementi per i tuoi beneficiari
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-sm mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-600">Ritiro Disponibilità</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            <span className="text-gray-600">Ritiro Richiesta</span>
          </div>
        </div>

        {/* Empty state */}
        {totalItems === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
            <PartyPopper className="mx-auto h-12 w-12 text-primary-300 mb-4" aria-hidden="true" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Niente da gestire</h2>
            <p className="text-gray-500">Tutti i tuoi beneficiari hanno ricevuto i loro oggetti!</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {items.map((item) => {
              const styles = TYPE_STYLES[item.type];
              const Icon = styles.Icon;

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-primary-300 transition border-l-4 ${styles.border} overflow-hidden`}
                >
                  <div className="flex gap-2 sm:gap-4">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {item.imageUrls && item.imageUrls.length > 0 ? (
                        <img
                          src={item.imageUrls[0]}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" aria-hidden="true" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-xs sm:text-sm truncate leading-tight">
                          {item.title}
                        </h3>
                      </div>

                      <p className="text-xs text-gray-500 mt-0.5">
                        Per: <span className="font-medium">{item.beneficiaryName}</span>
                        {item.beneficiaryAddress && ` - ${item.beneficiaryAddress}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Presso: <span className="font-medium">{item.entity.name}</span>
                        {item.entity.city && `, ${item.entity.city}`}
                      </p>
                      {item.depositLocation && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Posizione: <span className="font-medium">{item.depositLocation}</span>
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${styles.badge}`}>
                          {item.statusLabel}
                        </span>
                        <span className="text-xs text-gray-400">
                          {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] || item.category}
                        </span>
                      </div>
                    </div>

                    {/* QR button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openQRDialog(item)}
                      aria-label="Mostra QR"
                      title="Mostra QR"
                      className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 p-0"
                    >
                      <QrCode className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* QR Dialog riusato da /components/qr/QrDialog */}
      <QrDialog
        isOpen={showQRDialog}
        onClose={() => setShowQRDialog(false)}
        item={selectedItem}
      />
    </div>
  );
}

function toQrDialogItem(item: StreetDeliveryItem): QrDialogItem {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    statusLabel: item.statusLabel,
    beneficiaryName: item.beneficiaryName,
    beneficiaryAddress: item.beneficiaryAddress,
    entity: {
      name: item.entity.name,
      address: item.entity.address,
      houseNumber: item.entity.houseNumber,
      cap: item.entity.cap,
      city: item.entity.city,
      hoursInfo: item.entity.hoursInfo,
    },
    depositLocation: item.depositLocation,
    qrData: item.qrData,
    qrImageUrl: item.qrImageUrl,
  };
}
