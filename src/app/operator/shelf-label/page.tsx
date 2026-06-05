'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tag } from 'lucide-react';
import { Card, CardContent, Button, Spinner, toast } from '@/components/ui';
import { openPrintWindow, type PrintSize } from '@/components/qr/print-window';
import { generateQrCodeDataUrl } from '@/lib/qrcode-client';

export default function ShelfLabelPage() {
  const router = useRouter();

  const [stanza, setStanza] = useState('');
  const [scaffale, setScaffale] = useState('');
  const [piano, setPiano] = useState('');
  const [labelSize, setLabelSize] = useState<'50x30' | '50x40'>('50x30');
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // 1) Carica impostazioni organizzazione (labelSize default)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/operator/organization');
        if (!cancelled && res.ok) {
          const data = await res.json();
          const size = data.organization?.labelSize;
          if (size === '50x40' || size === '50x30') {
            setLabelSize(size);
          }
        }
      } catch (err) {
        console.error('Error fetching org settings:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 2) Rigenera QR ad ogni cambio dei 3 campi (debounce non necessario,
  //    QRCode.toDataURL è sub-millisecondo per 3 stringhe corte)
  const qrData = `${stanza}\n${scaffale}\n${piano}`;
  const isValid = stanza.trim() && scaffale.trim() && piano.trim();
  const isLarge = labelSize === '50x40';

  useEffect(() => {
    if (!isValid) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    generateQrCodeDataUrl(qrData)
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(null); });
    return () => { cancelled = true; };
  }, [qrData, isValid]);

  const handlePrint = () => {
    if (!isValid || !qrDataUrl) {
      toast.error('Compila tutti i campi prima di stampare');
      return;
    }
    const size: PrintSize = labelSize;
    const labelHeight = isLarge ? '40mm' : '30mm';
    const qrSizeMm = isLarge ? 18 : 16;
    const infoBoxWidthMm = 50 - qrSizeMm - 4;
    const logoAlberoHeightMm = 5;
    const logoTextHeightMm = logoAlberoHeightMm * 2;

    const bodyHtml = `
      <div class="label">
        <div class="top-row">
          <div class="qr-area"><img src="${qrDataUrl}" alt="QR" /></div>
          <div class="info-box">
            <div class="data-row"><span class="circle">S</span><span class="data-text">${escapeHtml(stanza)}</span></div>
            <div class="data-row"><span class="circle">S</span><span class="data-text">${escapeHtml(scaffale)}</span></div>
            <div class="data-row"><span class="circle">P</span><span class="data-text">${escapeHtml(piano)}</span></div>
          </div>
        </div>
        <div class="logo-row">
          <img class="albero" src="/albero.svg" alt="Kykos" />
          <img class="testo" src="/LogoKykosTesto.svg" alt="Kykos" />
        </div>
      </div>
    `;

    const preStyles = `
      .label { width: 50mm; height: ${labelHeight}; display: flex; flex-direction: column; padding: 2mm; background: white; }
      .top-row { display: flex; gap: 2mm; }
      .qr-area { width: ${qrSizeMm}mm; height: ${qrSizeMm}mm; flex-shrink: 0; }
      .qr-area img { width: ${qrSizeMm}mm; height: ${qrSizeMm}mm; }
      .info-box { width: ${infoBoxWidthMm}mm; display: flex; flex-direction: column; justify-content: center; gap: 0.5mm; }
      .data-row { display: flex; align-items: center; gap: 1mm; }
      .circle { display: inline-flex; align-items: center; justify-content: center; width: 4.5mm; height: 4.5mm; border-radius: 50%; border: 0.5mm solid #000; color: #000; font-size: 3.5mm; font-weight: bold; line-height: 1; }
      .data-text { font-size: 3.5mm; font-weight: bold; color: #000; line-height: 1; }
      .logo-row { display: flex; align-items: center; justify-content: center; gap: 2mm; margin-top: auto; padding-top: 0.5mm; }
      .logo-row img { display: block; }
      .logo-row img.albero { height: ${logoAlberoHeightMm}mm; width: ${logoAlberoHeightMm}mm; }
      .logo-row img.testo { height: ${logoTextHeightMm}mm; width: auto; }
    `;

    openPrintWindow({
      size,
      title: 'Etichetta Scaffale',
      bodyHtml,
      preStyles,
    });
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-4 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          ← Indietro
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-6">
          <div className="text-center">
            <Tag className="h-12 w-12 mx-auto text-primary-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Etichetta Scaffale</h1>
            <p className="text-gray-500 mt-2">Crea un&apos;etichetta per contrassegnare uno spazio</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stanza *</label>
              <input
                type="text"
                value={stanza}
                onChange={(e) => setStanza(e.target.value.toUpperCase())}
                placeholder="Es. A, B, MAGAZZINO"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none uppercase text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scaffale *</label>
              <input
                type="text"
                value={scaffale}
                onChange={(e) => setScaffale(e.target.value.toUpperCase())}
                placeholder="Es. 1, 2, A-12"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none uppercase text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Piano *</label>
              <input
                type="text"
                value={piano}
                onChange={(e) => setPiano(e.target.value.toUpperCase())}
                placeholder="Es. 1, 2, 3"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none uppercase text-sm"
              />
            </div>
          </div>

          {/* Preview */}
          {isValid && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 text-center">Anteprima</p>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-3 bg-white mx-auto"
                style={{
                  width: '220px',
                  height: isLarge ? '176px' : '132px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                  <div
                    className="flex-shrink-0 bg-gray-100 rounded flex items-center justify-center"
                    style={{ width: '90px', height: '90px' }}
                  >
                    {qrDataUrl && (
                      <img
                        src={qrDataUrl}
                        alt="QR Code"
                        style={{ width: '70px', height: '70px' }}
                      />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center gap-1">
                    <PreviewRow letter="S" value={stanza} />
                    <PreviewRow letter="S" value={scaffale} />
                    <PreviewRow letter="P" value={piano} />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <img src="/albero.svg" alt="Kykos" className="w-6 h-6" />
                  <img src="/LogoKykosTesto.svg" alt="Kykos" className="h-6 w-auto" />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/operator/scan-qr')}
              className="flex-1"
            >
              Annulla
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handlePrint}
              disabled={!isValid}
              className="flex-1"
            >
              Stampa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Riga anteprima: cerchio con lettera + valore (Stanza/Scaffale/Piano). */
function PreviewRow({ letter, value }: { letter: 'S' | 'P'; value: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="flex items-center justify-center w-6 h-6 rounded-full border border-gray-800 text-xs font-bold text-gray-800">
        {letter}
      </span>
      <span className="font-bold text-gray-800 text-sm">{value}</span>
    </div>
  );
}

/** Escape minimo per iniettare testo in HTML costruito a mano. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
