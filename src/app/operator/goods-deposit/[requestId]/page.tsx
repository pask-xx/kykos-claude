'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import QrScanner from 'qr-scanner';

interface LabelData {
  requestId: string;
  recipientName: string;
  itemDescription: string;
  depositDate: string;
  qrData: string;
}

export default function GoodsDepositLocationPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;

  const [loading, setLoading] = useState(true);
  const [goodsData, setGoodsData] = useState<{
    title: string;
    fulfilledById: string;
    fulfilledByName: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [depositLocation, setDepositLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [cameraId, setCameraId] = useState<string>('');
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [labelData, setLabelData] = useState<LabelData | null>(null);
  const [showLabelDialog, setShowLabelDialog] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);

  const isBackCamera = (label: string) => {
    const l = label.toLowerCase();
    return l.includes('back') || l.includes('rear') || l.includes('environment') ||
           l.includes('posteriore') || l.includes('retro');
  };
  const isFrontCamera = (label: string) => {
    const l = label.toLowerCase();
    return l.includes('front') || l.includes('face') ||
           l.includes('anteriore') || l.includes('frontale');
  };

  // Format QR data as (S): <stanza> - (S): <scaffale> - (P): <piano>
  const formatLocationFromQr = (data: string): string => {
    if (!data) return '';
    // Assume data is in format stanza\scaffale\piano or similar
    const parts = data.split(/[\s\n]+/).filter(p => p.trim());
    if (parts.length >= 3) {
      return `(S): ${parts[0]} - (S): ${parts[1]} - (P): ${parts[2]}`;
    }
    // If just one part, try splitting by common separators
    const separatorMatch = data.match(/^([A-Z]+)\s*[-_]?\s*(\S+)\s*[-_]?\s*(\S+)\s*[-_]?\s*(\S+)$/i);
    if (separatorMatch) {
      return `(S): ${separatorMatch[1]} - (S): ${separatorMatch[2]} - (P): ${separatorMatch[3]}`;
    }
    // Return original if can't parse
    return data;
  };

  useEffect(() => {
    // Get cameras on mount
    async function getCameras() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices
          .filter(d => d.kind === 'videoinput')
          .map(d => ({
            id: d.deviceId,
            label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
            kind: 'videoinput' as const,
          }));

        setCameras(videoDevices);

        const backCamera = videoDevices.find(c => isBackCamera(c.label));
        if (backCamera) setCameraId(backCamera.id);
        else if (videoDevices.length > 0) setCameraId(videoDevices[0].id);
      } catch (err) {
        console.error('Error getting cameras:', err);
      }
    }

    getCameras();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Fetch goods request data
    async function fetchData() {
      try {
        const res = await fetch(`/api/entity-requests?id=${requestId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.goodsRequest) {
            setGoodsData({
              title: data.goodsRequest.title,
              fulfilledById: data.goodsRequest.fulfilledBy?.id || '',
              fulfilledByName: data.goodsRequest.fulfilledBy?.name || 'Donatore',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [requestId]);

  const startScanner = async () => {
    if (!videoRef.current) return;

    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current = null;
      }

      const scanner = new QrScanner(videoRef.current, (scanResult) => {
        const data = typeof scanResult === 'string' ? scanResult : scanResult.data;
        scanner.stop();
        setShowScanner(false);
        // Format location as (S): <stanza> - (S): <scaffale> - (P): <piano>
        setDepositLocation(formatLocationFromQr(data));
      }, {
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        maxScansPerSecond: 5,
      });

      scannerRef.current = scanner;
      await scanner.setCamera(cameraId);
      await scanner.start();
    } catch (err) {
      console.error('Scanner error:', err);
      setError('Errore nell\'avvio della fotocamera');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current = null;
    }
    setShowScanner(false);
  };

  useEffect(() => {
    if (showScanner && videoRef.current && cameraId) {
      startScanner();
    } else {
      stopScanner();
    }
  }, [showScanner, cameraId]);

  const handleSave = async () => {
    if (!depositLocation.trim()) {
      setError('Inserisci la posizione di deposito');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Use the new scan-qr-goods endpoint for delivery confirmation
      const res = await fetch('/api/operator/scan-qr-goods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrData: `kykos:deliver:${requestId}:${goodsData?.fulfilledById || ''}`,
          depositLocation: depositLocation.trim(),
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setLabelData(data.labelData);
        setShowLabelDialog(true);
      } else {
        setError(data.error || 'Errore durante il salvataggio');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintLabel = () => {
    const printContent = labelRef.current;
    if (!printContent) return;

    const baseUrl = window.location.origin;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(labelData!.qrData)}&color=059669`;
    const alberoUrl = `${baseUrl}/albero.svg`;
    const logoTextUrl = `${baseUrl}/LogoKykosTesto.svg`;

    const printWindow = window.open('', '', 'width=400,height=300');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stampa Etichetta</title>
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
              <img src="${qrUrl}" alt="QR" />
            </div>
            <div class="info-area">
              <div class="logo-row">
                <img src="${alberoUrl}" alt="logo" />
                <img src="${logoTextUrl}" alt="Kykos" />
              </div>
              <div class="data">
                <div class="data-id">#${labelData!.requestId.slice(0, 8)}</div>
                <div class="data-name">${labelData!.recipientName}</div>
                <div class="data-item">${labelData!.itemDescription.slice(0, 20)}</div>
                <div class="data-date">Ritiro: ${labelData!.depositDate}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSkipLabel = () => {
    router.push('/operator/scan-qr?success=goods-deposit');
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
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          {/* Success Message */}
          <div className="text-center">
            <div className="text-5xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-green-700">Consegna Ricevuta</h1>
            <p className="text-gray-500 mt-2">Registra la posizione di deposito</p>
          </div>

          {/* Goods Info */}
          {goodsData && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="font-semibold text-gray-900 mb-1">{goodsData.title}</h2>
              <p className="text-sm text-gray-500">Da: {goodsData.fulfilledByName}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Location Input Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posizione di deposito *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={depositLocation}
                  onChange={(e) => setDepositLocation(e.target.value)}
                  placeholder="(S): Stanza - (S): Scaffale - (P): Piano"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(!showScanner)}
                  className={`px-4 py-3 rounded-lg font-medium ${
                    showScanner
                      ? 'bg-gray-200 text-gray-700'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  📷
                </button>
              </div>
            </div>

            {/* Scanner */}
            {showScanner && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-medium text-gray-700">Seleziona fotocamera</label>
                  <select
                    value={cameraId}
                    onChange={(e) => setCameraId(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    {cameras.map((cam) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.label} ({isBackCamera(cam.label) ? 'Posteriore' : isFrontCamera(cam.label) ? 'Frontale' : 'Altra'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '200px' }}>
                  <video
                    ref={videoRef}
                    className="w-full h-48 object-cover"
                    playsInline
                    muted
                  />
                </div>
                {depositLocation && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ Rilevato: <strong>{depositLocation}</strong>
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note (opzionali)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Aggiungi note sulla consegna..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/operator/scan-qr')}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !depositLocation.trim()}
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
            >
              {saving ? 'Salvataggio...' : 'Conferma posizione'}
            </button>
          </div>

          {/* Label Print Dialog */}
          {showLabelDialog && labelData && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
                <div className="text-center">
                  <div className="text-4xl mb-2">🖨️</div>
                  <h2 className="text-xl font-bold text-gray-900">Stampa Etichetta</h2>
                  <p className="text-sm text-gray-500">Applicare l'etichetta sull'oggetto</p>
                </div>

                {/* Label Preview */}
                <div
                  ref={labelRef}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-3 bg-white"
                  style={{ width: '190px', height: '114px', display: 'flex', gap: '8px', margin: '0 auto' }}
                >
                  {/* QR Code */}
                  <div
                    className="flex-shrink-0 bg-gray-100 rounded flex items-center justify-center"
                    style={{ width: '87px', height: '87px' }}
                  >
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(labelData.qrData)}&color=059669`}
                      alt="QR Code"
                      style={{ width: '87px', height: '87px' }}
                    />
                  </div>
                  {/* Label Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex items-center gap-1">
                      <img src="/albero.svg" alt="logo" className="w-6 h-6" />
                      <img src="/LogoKykosTesto.svg" alt="Kykos" className="h-5 w-auto" />
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div className="font-semibold text-gray-800">#{labelData.requestId.slice(0, 8)}</div>
                      <div className="text-gray-600 truncate">{labelData.recipientName}</div>
                      <div className="text-gray-500 truncate text-[10px]">{labelData.itemDescription}</div>
                      <div className="text-gray-400 text-[10px]">Ritiro: {labelData.depositDate}</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSkipLabel}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Salta
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintLabel}
                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                  >
                    Stampa
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface CameraDevice {
  id: string;
  label: string;
  kind: 'videoinput';
}
