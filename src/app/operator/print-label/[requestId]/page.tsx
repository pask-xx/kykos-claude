'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Printer, Tag } from 'lucide-react';
import { Card, CardContent, Button, SkeletonCard } from '@/components/ui';
import { openPrintWindow, type PrintSize } from '@/components/qr/print-window';
import { generateQrCodeDataUrl } from '@/lib/qrcode-client';

interface LabelData {
  requestId: string;
  recipientName: string;
  itemDescription: string;
  depositDate: string;
  qrData: string;
  /** '50x30' (default) o '50x40'. */
  labelSize: string;
}

export default function PrintLabelPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;

  const [labelData, setLabelData] = useState<LabelData | null>(null);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    // Legge labelData scritto dal flusso deposit (src/app/operator/deposit/[requestId]/page.tsx)
    const stored = sessionStorage.getItem('labelData');
    if (stored) {
      setLabelData(JSON.parse(stored));
    } else {
      router.push('/operator/scan-qr');
    }
  }, [requestId, router]);

  const handlePrint = async () => {
    if (!labelData) return;
    setPrinting(true);
    try {
      // QR generato lato client (no più api.qrserver.com)
      const qrDataUrl = await generateQrCodeDataUrl(labelData.qrData);

      // Spezza "Mario Rossi" → ["Mario", "Rossi"] per stilarli su 2 righe
      const nameParts = labelData.recipientName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ');

      const size: PrintSize = labelData.labelSize === '50x40' ? '50x40' : '50x30';

      // bodyHtml costruito inline (unico per questa etichetta 50x30/50x40).
      // Stili custom iniettati via `preStyles` per non sporcare il default in print-window.ts.
      const bodyHtml = `
        <div class="label">
          <div class="top-row">
            <div class="qr-area"><img src="${qrDataUrl}" alt="QR" /></div>
            <div class="info-box">
              <div class="logos">
                <img src="/albero.svg" alt="Kykos" style="height:7mm;width:7mm;" />
                <img src="/LogoKykosTesto.svg" alt="Kykos" style="height:7mm;width:auto;" />
              </div>
              <div class="beneficiary">
                <div class="beneficiary-name">${escapeHtml(firstName)}</div>
                ${lastName ? `<div class="beneficiary-name">${escapeHtml(lastName)}</div>` : ''}
              </div>
            </div>
          </div>
          <div class="title-bar">
            <div class="title-text">${escapeHtml(labelData.itemDescription)}</div>
          </div>
        </div>
      `;

      const preStyles = `
        .label { width: 50mm; height: 100%; display: flex; flex-direction: column; padding: 2mm; background: white; }
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
      `;

      openPrintWindow({
        size,
        title: `Etichetta - ${labelData.itemDescription}`,
        bodyHtml,
        preStyles,
      });
    } finally {
      // piccolo delay per feedback visivo del loading state
      setTimeout(() => setPrinting(false), 500);
    }
  };

  const handleSkip = () => {
    sessionStorage.removeItem('labelData');
    router.push('/operator/scan-qr?success=deposit');
  };

  if (!labelData) {
    return (
      <div className="max-w-xl mx-auto p-4">
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={handleSkip}>
          ← Annulla e torna alla scansione
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-6">
          <div className="text-center">
            <Printer className="h-12 w-12 mx-auto text-primary-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Stampa Etichetta</h1>
            <p className="text-gray-500 mt-2">Applicare l&apos;etichetta sull&apos;oggetto</p>
          </div>

          {/* Label Preview — replica della stampa 50x30mm, ~220x132px a 96dpi */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white mx-auto"
            style={{ width: '220px', height: '132px' }}
          >
            <div className="flex gap-2 h-full">
              <div className="flex-shrink-0 bg-gray-100 rounded flex items-center justify-center" style={{ width: '90px', height: '90px' }}>
                <Tag className="h-8 w-8 text-gray-400" />
              </div>
              <div className="flex-1 flex flex-col justify-start gap-1 min-w-0">
                <div className="flex items-center gap-1">
                  <img src="/albero.svg" alt="Kykos" style={{ width: '28px', height: '28px' }} />
                  <img src="/LogoKykosTesto.svg" alt="Kykos" style={{ height: '28px', width: 'auto' }} />
                </div>
                <div className="text-xs">
                  <div className="font-medium text-gray-800 truncate">{labelData.recipientName}</div>
                </div>
                <div className="text-xs text-gray-500 truncate">{labelData.itemDescription}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleSkip}
              className="flex-1"
              disabled={printing}
            >
              Salta
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handlePrint}
              className="flex-1"
              loading={printing}
            >
              Stampa
            </Button>
          </div>
        </CardContent>
      </Card>
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
