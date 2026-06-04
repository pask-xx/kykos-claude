'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface GoodsPickupQrData {
  title: string;
  beneficiaryNickname: string;
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
        // Use beneficiary nickname (generate from name if not available)
        const beneficiaryName = apiData.goodsRequest.beneficiary?.name || 'Beneficiario';
        const nickname = beneficiaryName.split(' ')[0]; // Use first name as nickname fallback
        setData({
          title: apiData.goodsRequest.title,
          beneficiaryNickname: apiData.goodsRequest.beneficiary?.nickname || nickname,
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

    const printWindow = window.open('', '', 'width=600,height=800');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Ritiro - KYKOS</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
            .container { max-width: 400px; margin: 0 auto; text-align: center; }
            .logo-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 20px; }
            .logo-row img { height: 40px; width: auto; }
            .logo-row span { font-size: 24px; font-weight: bold; color: #374151; }
            .qr-box { border: 2px dashed #d1d5db; border-radius: 12px; padding: 30px; background: #f9fafb; }
            .qr-box img { width: 250px; height: 250px; }
            .info { margin-top: 20px; }
            .info h2 { font-size: 18px; color: #111827; margin-bottom: 8px; }
            .info p { color: #6b7280; font-size: 14px; }
            .nickname { font-size: 24px; font-weight: bold; color: #059669; margin-top: 15px; }
            .id-badge { background: #e5e7eb; padding: 4px 12px; border-radius: 20px; font-size: 12px; color: #374151; margin-top: 10px; display: inline-block; }
            .footer { margin-top: 30px; font-size: 12px; color: #9ca3af; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo-row">
              <img src="${window.location.origin}/albero.svg" alt="logo" />
              <span>KYKOS</span>
            </div>
            <div class="qr-box">
              <img src="${data.pickupQrImageUrl}" alt="QR Ritiro" />
              <div class="info">
                <h2>${data.title}</h2>
                <p>Ritiro beneficiario</p>
                <div class="nickname">${data.beneficiaryNickname}</div>
                <div class="id-badge">#${requestId.slice(0, 8)}</div>
              </div>
            </div>
            <div class="footer">
              Kykos - Ritiro beni
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

          {/* Item Info - shows title only, NO donor name per anonymity rules */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="font-semibold text-gray-900 mb-1">{data.title}</h2>
            <p className="text-sm text-gray-500">
              Beneficiario: <strong className="text-primary-600">{data.beneficiaryNickname}</strong>
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
