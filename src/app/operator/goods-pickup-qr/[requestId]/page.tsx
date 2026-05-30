'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface GoodsPickupQrData {
  title: string;
  beneficiaryName: string;
  fulfilledByName: string;
  status: string;
  pickupQrData: string;
  pickupQrImageUrl: string;
}

export default function GoodsPickupQrPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GoodsPickupQrData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [requestId]);

  const fetchData = async () => {
    try {
      // Fetch from the operator goods requests QR endpoint
      const res = await fetch(`/api/operator/goods-requests/${requestId}/qr`);
      if (res.ok) {
        const apiData = await res.json();
        setData({
          title: apiData.goodsRequest.title,
          beneficiaryName: apiData.goodsRequest.beneficiary?.name || 'Beneficiario',
          fulfilledByName: apiData.goodsRequest.fulfilledBy?.name || 'Donatore',
          status: apiData.goodsRequest.status,
          pickupQrData: apiData.qrCodes.pickup.data,
          pickupQrImageUrl: apiData.qrCodes.pickup.imageUrl,
        });
      } else {
        setError('Richiesta non trovata');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!data) return;

    const printWindow = window.open('', '', 'width=400,height=300');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stampa QR - Ritiro</title>
          <style>
            @page { size: 50mm 30mm; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 50mm; height: 30mm; }
            .label { width: 50mm; height: 30mm; display: flex; gap: 2mm; padding: 2mm; background: white; }
            .qr-area { width: 23mm; height: 26mm; flex-shrink: 0; }
            .qr-area img { width: 23mm; height: 23mm; }
            .info-area { width: 23mm; height: 26mm; display: flex; flex-direction: column; justify-content: space-between; }
            .logo-row { display: flex; align-items: center; gap: 1mm; }
            .logo-row img { height: 4mm; width: auto; }
            .logo-row span { font-size: 4mm; font-weight: bold; color: #374151; }
            .data { font-size: 3mm; line-height: 1.3; }
            .data-id { font-weight: bold; }
            .data-name { color: #4b5563; }
            .data-item { color: #6b7280; font-size: 2.5mm; }
            .data-date { color: #9ca3af; font-size: 2.5mm; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="qr-area">
              <img src="${data.pickupQrImageUrl}" alt="QR Ritiro" />
            </div>
            <div class="info-area">
              <div class="logo-row">
                <img src="${window.location.origin}/albero.svg" alt="logo" />
                <img src="${window.location.origin}/LogoKykosTesto.svg" alt="Kykos" />
              </div>
              <div class="data">
                <div class="data-id">#${requestId.slice(0, 8)}</div>
                <div class="data-name">${data.beneficiaryName}</div>
                <div class="data-item">${data.title.slice(0, 20)}</div>
                <div class="data-date">Ritiro</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Indietro
            </button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-xl">
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-red-700 mb-2">Errore</h1>
            <p className="text-gray-600">{error || 'Dati non disponibili'}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Indietro
          </button>
          <h1 className="text-lg font-semibold text-gray-900">QR Ritiro</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          {/* Title */}
          <div className="text-center">
            <div className="text-5xl mb-4">📦</div>
            <h1 className="text-xl font-bold text-gray-900">QR Code di Ritiro</h1>
            <p className="text-gray-500 text-sm mt-1">Mostra questo QR al beneficiario per il ritiro</p>
          </div>

          {/* Item Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="font-semibold text-gray-900 mb-1">{data.title}</h2>
            <p className="text-sm text-gray-500">
              Donato da: {data.fulfilledByName}
            </p>
            <p className="text-sm text-gray-500">
              Per: <strong>{data.beneficiaryName}</strong>
            </p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
              <img
                src={data.pickupQrImageUrl}
                alt="QR Code per Ritiro"
                className="w-64 h-64"
              />
            </div>
            <p className="text-sm text-gray-500 mt-3 text-center">
              Il beneficiario scansiona questo QR<br />per confermare il ritiro
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Chiudi
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center justify-center gap-2"
            >
              🖨️ Stampa
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
