'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CATEGORY_LABELS } from '@/types';

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
}

const TYPE_COLORS: Record<string, { border: string; badge: string; icon: string }> = {
  OBJECT: { border: 'border-l-green-500', badge: 'bg-green-100 text-green-700', icon: '📦' },
  GOODS: { border: 'border-l-purple-500', badge: 'bg-purple-100 text-purple-700', icon: '🎁' },
};

export default function StreetToDeliverPage() {
  const [items, setItems] = useState<StreetDeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<StreetDeliveryItem | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [sharing, setSharing] = useState(false);

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
      setError(err instanceof Error ? err.message : 'Errore');
    } finally {
      setLoading(false);
    }
  };

  const handleShareQR = async (item: StreetDeliveryItem) => {
    if (!item.qrImageUrl) return;

    if (!navigator.share) {
      alert('La condivisione non è supportata su questo dispositivo');
      return;
    }

    setSharing(true);
    try {
      const blob = await fetch(item.qrImageUrl).then(r => r.blob());
      const file = new File([blob], `kykos-${item.type.toLowerCase()}-${item.id}.png`, { type: 'image/png' });

      await navigator.share({
        title: `KYKOS - ${item.statusLabel}`,
        text: `${item.statusLabel}: "${item.title}" per @${item.beneficiaryNickname || item.beneficiaryName}`,
        files: [file],
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share error:', err);
      }
    } finally {
      setSharing(false);
    }
  };

  const handleEmailShare = async (item: StreetDeliveryItem) => {
    if (!item.qrImageUrl) return;

    setSharing(true);
    try {
      const subject = encodeURIComponent(`KYKOS - ${item.statusLabel}`);
      const body = encodeURIComponent(
        `${item.statusLabel}: "${item.title}"\n` +
        `Per: @${item.beneficiaryNickname || item.beneficiaryName}\n` +
        `QR Code: ${item.qrData}\n\n` +
        `Download QR: ${item.qrImageUrl}`
      );
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    } catch (err) {
      console.error('Email share error:', err);
    } finally {
      setSharing(false);
    }
  };

  const handleWhatsAppShare = async (item: StreetDeliveryItem) => {
    if (!item.qrImageUrl) return;

    const message = `${item.statusLabel}: "${item.title}"\nPer: @${item.beneficiaryNickname || item.beneficiaryName}\n\nQR Code: ${item.qrData}\n\nDownload QR: ${item.qrImageUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDownload = (item: StreetDeliveryItem) => {
    if (!item.qrImageUrl) return;
    const link = document.createElement('a');
    link.href = item.qrImageUrl;
    link.download = `kykos-${item.type.toLowerCase()}-${item.id}.png`;
    link.click();
  };

  const handlePrintQR = (item: StreetDeliveryItem) => {
    if (!item.qrImageUrl) return;

    const printWindow = window.open('', '', 'width=400,height=500');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stampa QR - KYKOS</title>
          <style>
            @page { size: 60mm 80mm; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 60mm; height: 80mm; }
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: Arial, sans-serif; padding: 5mm; }
            .logo-row { display: flex; align-items: center; gap: 2mm; margin-bottom: 3mm; }
            .logo-row img { height: 8mm; width: auto; }
            .beneficiary { font-size: 11pt; font-weight: bold; margin-bottom: 2mm; text-align: center; }
            .title { font-size: 9pt; color: #666; margin-bottom: 3mm; text-align: center; max-width: 55mm; }
            .qr-area { border: 1px solid #eee; padding: 2mm; background: white; }
            .qr-area img { width: 50mm; height: 50mm; }
            .footer { font-size: 7pt; color: #999; margin-top: 3mm; text-align: center; }
          </style>
        </head>
        <body>
          <div class="logo-row">
            <img src="${window.location.origin}/albero.svg" alt="KYKOS" />
            <img src="${window.location.origin}/LogoKykosTesto.svg" alt="Kykos" />
          </div>
          <div class="beneficiary">@${item.beneficiaryNickname || item.beneficiaryName}</div>
          <div class="title">${item.title}</div>
          <div class="qr-area">
            <img src="${item.qrImageUrl}" alt="QR Code" />
          </div>
          <div class="footer">KYKOS - ${item.statusLabel}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const openQRDialog = (item: StreetDeliveryItem) => {
    setSelectedItem(item);
    setShowQRDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-500">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchItems} className="text-primary-600 hover:underline">
            Riprova
          </button>
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
              <h1 className="text-2xl font-bold text-gray-900">Consegne e Ritiri</h1>
              <p className="text-gray-500 text-sm mt-1">
                {totalItems} elementi per i tuoi beneficiari
              </p>
            </div>
            <Link
              href="/operator/scan-qr"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm"
            >
              📷 Scansiona QR
            </Link>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-sm mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-600">Ritiri Oggetti</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            <span className="text-gray-600">Consegne Richieste</span>
          </div>
        </div>

        {/* Empty state */}
        {totalItems === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-8 sm:p-12 text-center">
            <span className="text-4xl sm:text-5xl mb-4 block">🎉</span>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Niente da gestire</h2>
            <p className="text-gray-500">Tutti i tuoi beneficiari hanno ricevuto i loro oggetti!</p>
          </div>
        )}

        {/* Unified list */}
        {totalItems > 0 && (
          <div className="grid gap-3 sm:gap-4">
            {items.map((item) => {
              const colors = TYPE_COLORS[item.type];
              const displayName = item.beneficiaryNickname
                ? `@${item.beneficiaryNickname}`
                : item.beneficiaryName;

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-primary-300 transition border-l-4 ${colors.border} overflow-hidden`}
                >
                  <div className="flex gap-2 sm:gap-4">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {item.imageUrls && item.imageUrls.length > 0 ? (
                        <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-base sm:text-xl">{colors.icon}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-xs sm:text-sm truncate leading-tight">{item.title}</h3>
                      </div>

                      <p className="text-xs text-gray-500 mt-0.5">
                        Per: <span className="font-medium">{displayName}</span>
                        {item.depositLocation && ` • ${item.depositLocation}`}
                      </p>

                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${colors.badge}`}>
                          {item.statusLabel}
                        </span>
                        <span className="text-xs text-gray-400">
                          {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] || item.category}
                        </span>
                      </div>
                    </div>

                    {/* QR Button */}
                    <button
                      onClick={() => openQRDialog(item)}
                      className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-primary-50 hover:bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 transition"
                      title="Mostra QR"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* QR Dialog */}
      {showQRDialog && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{selectedItem.statusLabel}</h3>
                <button
                  onClick={() => setShowQRDialog(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Item info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-900">{selectedItem.title}</p>
                <p className="text-sm text-gray-500">
                  Per: <span className="font-medium">@{selectedItem.beneficiaryNickname || selectedItem.beneficiaryName}</span>
                </p>
                {selectedItem.depositLocation && (
                  <p className="text-sm text-gray-500">
                    Posizione: <span className="font-medium">{selectedItem.depositLocation}</span>
                  </p>
                )}
                {selectedItem.beneficiaryAddress && (
                  <p className="text-sm text-gray-500">
                    Indirizzo: <span className="font-medium">{selectedItem.beneficiaryAddress}</span>
                  </p>
                )}
              </div>

              {/* QR Code */}
              {selectedItem.qrImageUrl && (
                <div className="flex justify-center">
                  <div className="relative">
                    <img src={selectedItem.qrImageUrl} alt="QR Code" className="w-56 h-56" />
                    <div className="absolute top-2 left-2 bg-white rounded-full p-1 shadow">
                      <img src="/albero.svg" alt="KYKOS" className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              )}

              {/* QR Data */}
              <p className="text-xs text-gray-400 text-center font-mono truncate px-4">
                {selectedItem.qrData}
              </p>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    handleShareQR(selectedItem);
                    setShowQRDialog(false);
                  }}
                  disabled={sharing || !selectedItem.qrImageUrl}
                  className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
                >
                  {sharing ? 'Condivisione...' : 'Condividi QR'}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleEmailShare(selectedItem);
                      setShowQRDialog(false);
                    }}
                    disabled={sharing}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm disabled:opacity-50"
                  >
                    Email
                  </button>
                  <button
                    onClick={() => {
                      handleWhatsAppShare(selectedItem);
                      setShowQRDialog(false);
                    }}
                    disabled={sharing}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm disabled:opacity-50"
                  >
                    WhatsApp
                  </button>
                  <button
                    onClick={() => handleDownload(selectedItem)}
                    disabled={!selectedItem.qrImageUrl}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm disabled:opacity-50"
                  >
                    Download
                  </button>
                </div>

                <button
                  onClick={() => handlePrintQR(selectedItem)}
                  disabled={!selectedItem.qrImageUrl}
                  className="w-full px-4 py-3 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  🖨️ Stampa QR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}