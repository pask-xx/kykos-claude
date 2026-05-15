'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import QRCode from 'qrcode';

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

  const handlePrint = async () => {
    if (!labelData || !labelRef.current) return;

    const qrDataUrl = await QRCode.toDataURL(labelData.qrData, {
      width: 90,
      margin: 0,
      color: { dark: '#059669', light: '#ffffff' },
    });

    const logoAlberoUrl = '/albero.svg';
    const logoTextUrl = '/LogoKykosTesto.svg';

    const printWindow = window.open('', '', 'width=400,height=400');
    if (!printWindow) return;

    // Split beneficiary name into first and last
    const nameParts = labelData.recipientName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Etichetta - ${labelData.itemDescription}</title>
        <style>
          @page { size: 50mm 30mm; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 50mm; height: 30mm; }
          .label { width: 50mm; height: 30mm; display: flex; flex-direction: column; padding: 2mm; background: white; }
          .top-row { display: flex; align-items: flex-start; gap: 2mm; }
          .qr-area { width: 18mm; height: 18mm; flex-shrink: 0; }
          .qr-area img { width: 18mm; height: 18mm; }
          .info-box { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; }
          .logos { display: flex; align-items: center; gap: 1mm; margin-bottom: 1mm; }
          .logos img { display: block; }
          .beneficiary { font-size: 3.5mm; line-height: 1.4; color: #333; }
          .beneficiary-name { font-weight: bold; }
          .title-bar { width: 100%; margin-top: auto; padding-top: 1mm; }
          .title-text { font-size: 3mm; color: #555; line-height: 1.2; }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="top-row">
            <div class="qr-area">
              <img src="${qrDataUrl}" alt="QR" />
            </div>
            <div class="info-box">
              <div class="logos">
                <img src="${logoAlberoUrl}" alt="logo" style="height: 7mm; width: 7mm;" />
                <img src="${logoTextUrl}" alt="Kykos" style="height: 7mm; width: auto;" />
              </div>
              <div class="beneficiary">
                <div class="beneficiary-name">${firstName}</div>
                ${lastName ? `<div class="beneficiary-name">${lastName}</div>` : ''}
              </div>
            </div>
          </div>
          <div class="title-bar">
            <div class="title-text">${labelData.itemDescription}</div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    await new Promise(resolve => setTimeout(resolve, 2000));
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
              height: '132px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {/* Top row: QR + info */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* QR Code */}
              <div
                className="flex-shrink-0 bg-gray-100 rounded flex items-center justify-center"
                style={{ width: '90px', height: '90px' }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(labelData.qrData)}&color=059669`}
                  alt="QR Code"
                  style={{ width: '90px', height: '90px' }}
                />
              </div>
              {/* Info box */}
              <div className="flex-1 flex flex-col justify-start gap-1 min-w-0">
                <div className="flex items-center gap-1">
                  <img src="/albero.svg" alt="logo" style={{ width: '28px', height: '28px' }} />
                  <img src="/LogoKykosTesto.svg" alt="Kykos" style={{ height: '28px', width: 'auto' }} />
                </div>
                <div className="text-xs">
                  <div className="font-medium text-gray-800">{labelData.recipientName}</div>
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