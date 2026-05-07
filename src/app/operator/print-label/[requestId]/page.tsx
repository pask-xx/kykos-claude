'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface LabelData {
  requestId: string;
  recipientName: string;
  itemDescription: string;
  depositDate: string;
  qrData: string;
  labelSize: string;
}

export default function PrintLabelPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;

  const [labelData, setLabelData] = useState<LabelData | null>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Retrieve label data passed via query params or sessionStorage
    const stored = sessionStorage.getItem('labelData');
    if (stored) {
      setLabelData(JSON.parse(stored));
    } else {
      router.push('/operator/scan-qr');
    }
  }, [requestId, router]);

  const handlePrint = () => {
    if (!labelData || !labelRef.current) return;

    const baseUrl = window.location.origin;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(labelData.qrData)}&color=059669`;
    const alberoUrl = `${baseUrl}/albero.svg`;
    const logoTextUrl = `${baseUrl}/LogoKykosTesto.svg`;

    const isLarge = labelData.labelSize === '50x40';
    const labelHeight = isLarge ? '40mm' : '30mm';

    const printWindow = window.open('', '', 'width=400,height=400');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stampa Etichetta</title>
          <style>
            @page { size: 50mm ${labelHeight}; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 50mm; height: ${labelHeight}; }
            .label { width: 50mm; height: ${labelHeight}; display: flex; flex-direction: column; padding: 2mm; background: white; }
            .top-row { display: flex; gap: 2mm; }
            .qr-area { width: 23mm; height: 23mm; flex-shrink: 0; }
            .qr-area img { width: 23mm; height: 23mm; }
            .info-box { width: 23mm; display: flex; flex-direction: column; gap: 1mm; }
            .logo-row { display: flex; align-items: center; gap: 1mm; }
            .logo-row img { height: 5mm; width: auto; }
            .info-text { font-size: 3mm; line-height: 1.3; color: #4b5563; }
            .info-name { font-weight: bold; color: #1f2937; }
            .info-date { color: #9ca3af; font-size: 2.5mm; }
            .item-row { width: 100%; }
            .item-text { font-size: 2.5mm; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="top-row">
              <div class="qr-area">
                <img src="${qrUrl}" alt="QR" />
              </div>
              <div class="info-box">
                <div class="logo-row">
                  <img src="${alberoUrl}" alt="logo" />
                  <img src="${logoTextUrl}" alt="Kykos" />
                </div>
                <div class="info-text">
                  <div class="info-name">${labelData.recipientName}</div>
                  <div class="info-date">Ritiro: ${labelData.depositDate}</div>
                </div>
              </div>
            </div>
            <div class="item-row">
              <div class="item-text">${labelData.itemDescription}</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSkip = () => {
    sessionStorage.removeItem('labelData');
    router.push('/operator/scan-qr?success=deposit');
  };

  if (!labelData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Annulla e torna alla scansione
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-xl">
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-4">🖨️</div>
            <h1 className="text-2xl font-bold text-gray-900">Stampa Etichetta</h1>
            <p className="text-gray-500 mt-2">Applicare l&apos;etichetta sull&apos;oggetto</p>
          </div>

          {/* Label Preview */}
          <div
            ref={labelRef}
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white mx-auto"
            style={{
              width: '220px',
              height: labelData.labelSize === '50x40' ? '176px' : '132px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {/* Top row: QR + info */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* QR Code */}
              <div
                className="flex-shrink-0 bg-gray-100 rounded flex items-center justify-center"
                style={{ width: '100px', height: '100px' }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(labelData.qrData)}&color=059669`}
                  alt="QR Code"
                  style={{ width: '100px', height: '100px' }}
                />
              </div>
              {/* Info box */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="flex items-center gap-1">
                  <img src="/albero.svg" alt="logo" className="w-8 h-8" />
                  <img src="/LogoKykosTesto.svg" alt="Kykos" className="h-6 w-auto" />
                </div>
                <div className="text-xs">
                  <div className="font-medium text-gray-800 truncate">{labelData.recipientName}</div>
                  <div className="text-gray-400 text-[10px]">Ritiro: {labelData.depositDate}</div>
                </div>
              </div>
            </div>
            {/* Item description: full width */}
            <div className="text-xs text-gray-500 truncate px-1">{labelData.itemDescription}</div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Salta
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Stampa
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}