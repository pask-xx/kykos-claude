'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

const LOGO_ALBERO = 'https://mgfehedinbulejagvqus.supabase.co/storage/v1/object/public/labels/labels/albero.png';
const LOGO_TEXT = 'https://mgfehedinbulejagvqus.supabase.co/storage/v1/object/public/labels/labels/LogoKykosTesto.png';

async function fetchAsDataUri(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function svgToPngDataUri(svgDataUri: string, width: number, height: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = svgDataUri;
  });
}

export default function ShelfLabelPage() {
  const router = useRouter();

  const [stanza, setStanza] = useState('');
  const [scaffale, setScaffale] = useState('');
  const [piano, setPiano] = useState('');
  const [labelSize, setLabelSize] = useState('50x30');
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrgSettings() {
      try {
        const res = await fetch('/api/operator/organization');
        if (res.ok) {
          const data = await res.json();
          if (data.organization?.labelSize) {
            setLabelSize(data.organization.labelSize);
          }
        }
      } catch (err) {
        console.error('Error fetching org settings:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrgSettings();
  }, []);

  const qrData = `${stanza}\n${scaffale}\n${piano}`;
  const isValid = stanza.trim() && scaffale.trim() && piano.trim();
  const isLarge = labelSize === '50x40';

  useEffect(() => {
    if (!qrData.trim()) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(qrData, {
      width: 105,
      margin: 0,
      color: { dark: '#059669', light: '#ffffff' },
    }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [qrData]);

  const handlePrint = async () => {
    if (!isValid || !qrDataUrl) return;

    const [logoAlberoSvg, logoTextSvg, qrBase64] = await Promise.all([
      fetchAsDataUri(LOGO_ALBERO),
      fetchAsDataUri(LOGO_TEXT),
      Promise.resolve(qrDataUrl),
    ]);

    const [logoAlbero, logoText] = await Promise.all([
      svgToPngDataUri(logoAlberoSvg, 80, 80),
      svgToPngDataUri(logoTextSvg, 200, 50),
    ]);

    const labelHeight = isLarge ? '40mm' : '30mm';
    const qrSize = isLarge ? 18 : 16;

    const printWindow = window.open('', '', 'width=400,height=400');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Etichetta Scaffale</title>
<style>
@page { size: 50mm ${labelHeight}; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 50mm; height: ${labelHeight}; }
.label { width: 50mm; height: ${labelHeight}; display: flex; flex-direction: column; padding: 2mm; background: white; }
.top-row { display: flex; gap: 2mm; }
.qr-area { width: ${qrSize}mm; height: ${qrSize}mm; flex-shrink: 0; }
.qr-area img { width: ${qrSize}mm; height: ${qrSize}mm; }
.info-box { width: ${50 - qrSize - 4}mm; display: flex; flex-direction: column; gap: 1mm; }
.logo-row { display: flex; align-items: center; gap: 1mm; }
.logo-row img { display: block; height: 4mm; width: 4mm; }
.shelf-data { font-size: 3.5mm; line-height: 1.5; color: #1f2937; }
.shelf-row { display: flex; align-items: baseline; gap: 1mm; }
.shelf-icon { font-size: 2.5mm; color: #6b7280; }
</style>
</head>
<body>
<div class="label">
  <div class="top-row">
    <div class="qr-area">
      <img src="${qrBase64}" alt="QR" />
    </div>
    <div class="info-box">
      <div class="logo-row">
        <img src="${logoAlbero}" alt="logo" />
        <img src="${logoText}" alt="Kykos" />
      </div>
      <div class="shelf-data">
        <div class="shelf-row"><span class="shelf-icon">S</span>${stanza}</div>
        <div class="shelf-row"><span class="shelf-icon">S</span>${scaffale}</div>
        <div class="shelf-row"><span class="shelf-icon">P</span>${piano}</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
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
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Indietro
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-xl">
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-4">🏷️</div>
            <h1 className="text-2xl font-bold text-gray-900">Etichetta Scaffale</h1>
            <p className="text-gray-500 mt-2">Crea un&apos;etichetta per contrassegnare uno spazio</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stanza *</label>
              <input
                type="text"
                value={stanza}
                onChange={(e) => setStanza(e.target.value.toUpperCase())}
                placeholder="Es. A, B, MAGAZZINO"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scaffale *</label>
              <input
                type="text"
                value={scaffale}
                onChange={(e) => setScaffale(e.target.value.toUpperCase())}
                placeholder="Es. 1, 2, A-12"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Piano *</label>
              <input
                type="text"
                value={piano}
                onChange={(e) => setPiano(e.target.value.toUpperCase())}
                placeholder="Es. 1, 2, 3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none uppercase"
              />
            </div>
          </div>

          {/* Preview */}
          {isValid && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 text-center">Anteprima</p>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white mx-auto"
                style={{
                  width: '220px',
                  height: isLarge ? '176px' : '132px',
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
                      src={qrDataUrl || ''}
                      alt="QR Code"
                      style={{ width: '70px', height: '70px' }}
                    />
                  </div>
                  {/* Info box */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex items-center gap-1">
                      <img src="/albero.svg" alt="logo" className="w-8 h-8" />
                      <img src="/LogoKykosTesto.svg" alt="Kykos" className="h-6 w-auto" />
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">S</span>
                        <span className="font-medium text-gray-800">{stanza}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">S</span>
                        <span className="font-medium text-gray-800">{scaffale}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">P</span>
                        <span className="font-medium text-gray-800">{piano}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/operator/scan-qr')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Annulla
            </button>
            <button
              onClick={handlePrint}
              disabled={!isValid}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Stampa
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}