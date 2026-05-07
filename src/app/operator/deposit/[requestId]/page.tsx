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
  labelSize: string;
}

export default function DepositLocationPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;

  const [loading, setLoading] = useState(false);
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
        setDepositLocation(data);
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
      const res = await fetch(`/api/operator/scan-qr/${requestId}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositLocation: depositLocation.trim(),
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.showLabelDialog && data.labelData) {
          setLabelData(data.labelData);
          setShowLabelDialog(true);
        } else {
          router.push('/operator/scan-qr?success=deposit');
        }
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
    if (!labelData) return;

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

  const handleSkipLabel = () => {
    router.push('/operator/scan-qr?success=deposit');
  };

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
            <h1 className="text-2xl font-bold text-green-700">Consegna Registrata</h1>
            <p className="text-gray-500 mt-2">Ora registrazione la posizione di deposito</p>
          </div>

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
                  placeholder="Es. Scaffale A-12"
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
                  <p className="text-sm text-gray-500">Applicare l&apos;etichetta sull&apos;oggetto</p>
                </div>

                {/* Label Preview */}
                <div
                  ref={labelRef}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-3 bg-white"
                  style={{
                    width: '190px',
                    height: labelData.labelSize === '50x40' ? '152px' : '114px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    margin: '0 auto',
                  }}
                >
                  {/* Top row: QR + info box */}
                  <div style={{ display: 'flex', gap: '6px' }}>
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
                    {/* Info box: logos + name + date */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex items-center gap-1">
                        <img src="/albero.svg" alt="logo" className="w-7 h-7" />
                        <img src="/LogoKykosTesto.svg" alt="Kykos" className="h-5 w-auto" />
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