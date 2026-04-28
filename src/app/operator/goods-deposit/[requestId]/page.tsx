'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import QrScanner from 'qr-scanner';

export default function GoodsDepositLocationPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;

  const [loading, setLoading] = useState(true);
  const [goodsData, setGoodsData] = useState<{
    title: string;
    fulfilledByName: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [depositLocation, setDepositLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [cameraId, setCameraId] = useState<string>('');
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);

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
      // Use the new scan-qr-goods endpoint for delivery confirmation
      const res = await fetch('/api/operator/scan-qr-goods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrData: `kykos:deliver:${requestId}:${goodsData?.fulfilledByName || ''}`,
          depositLocation: depositLocation.trim(),
          notes: notes.trim() || undefined,
        }),
      });

      if (res.ok) {
        router.push('/operator/scan-qr?success=goods-deposit');
      } else {
        const data = await res.json();
        setError(data.error || 'Errore durante il salvataggio');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setSaving(false);
    }
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
