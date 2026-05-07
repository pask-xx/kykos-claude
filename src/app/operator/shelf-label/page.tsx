'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShelfLabelPage() {
  const router = useRouter();

  const [stanza, setStanza] = useState('');
  const [scaffale, setScaffale] = useState('');
  const [piano, setPiano] = useState('');
  const [labelSize, setLabelSize] = useState('50x30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch organization settings
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

  const handlePrint = () => {
    if (!isValid) return;

    const baseUrl = window.location.origin;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}&color=059669`;
    const alberoUrl = `${baseUrl}/albero.svg`;
    const logoTextUrl = `${baseUrl}/LogoKykosTesto.svg`;

    const labelHeight = isLarge ? '40mm' : '30mm';

    const printWindow = window.open('', '', 'width=400,height=400');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etichetta Scaffale</title>
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
            .shelf-data { font-size: 3mm; line-height: 1.4; color: #1f2937; }
            .shelf-label { font-size: 2mm; color: #9ca3af; text-transform: uppercase; }
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
                <div class="shelf-data">
                  <div><span class="shelf-label">Stanza</span><br>${stanza}</div>
                  <div><span class="shelf-label">Scaffale</span><br>${scaffale}</div>
                  <div><span class="shelf-label">Piano</span><br>${piano}</div>
                </div>
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
                onChange={(e) => setStanza(e.target.value)}
                placeholder="Es. A, B, Magazzino"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scaffale *</label>
              <input
                type="text"
                value={scaffale}
                onChange={(e) => setScaffale(e.target.value)}
                placeholder="Es. 1, 2, A-12"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Piano *</label>
              <input
                type="text"
                value={piano}
                onChange={(e) => setPiano(e.target.value)}
                placeholder="Es. 1, 2, Terra, Seminterrato"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
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
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}&color=059669`}
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
                    <div className="text-xs space-y-1">
                      <div className="text-gray-400 text-[10px] uppercase">Stanza</div>
                      <div className="font-medium text-gray-800">{stanza}</div>
                      <div className="text-gray-400 text-[10px] uppercase">Scaffale</div>
                      <div className="font-medium text-gray-800">{scaffale}</div>
                      <div className="text-gray-400 text-[10px] uppercase">Piano</div>
                      <div className="font-medium text-gray-800">{piano}</div>
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