'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function ScanQrPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    objectTitle?: string;
    recipientName?: string;
    type?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [qrReaderKey, setQrReaderKey] = useState(0);

  useEffect(() => {
    Html5Qrcode.getCameras().then((cameraList) => {
      if (cameraList && cameraList.length > 0) {
        setCameras(cameraList.map(c => ({ id: c.id, label: c.label || `Camera ${c.id}` })));
        setSelectedCamera(cameraList[0].id);
      }
    }).catch((err) => {
      console.error('Camera error:', err);
      setError('Impossibile accedere alla fotocamera');
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    if (!selectedCamera) return;

    setScanning(true);
    setResult(null);
    setError(null);
    setQrReaderKey(prev => prev + 1);

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          await scanner.stop();

          const res = await fetch('/api/operator/scan-qr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qrData: decodedText }),
          });
          const data = await res.json();

          if (res.ok) {
            setResult({
              success: true,
              message: data.message,
              objectTitle: data.data?.objectTitle,
              recipientName: data.data?.recipientName,
              type: data.type,
            });
          } else {
            setResult({
              success: false,
              message: data.error || 'Errore sconosciuto',
            });
          }

          setScanning(false);
        },
        () => {}
      );
    } catch (err) {
      console.error('Scanner error:', err);
      setError('Errore nell\'avvio della fotocamera. Controlla che il permesso sia stato concesso.');
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
    }
    setScanning(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scansiona QR Code</h1>
        <p className="text-gray-500">Inquadra il QR code per registrare consegna o ritiro</p>
      </div>

      {/* Camera Selection */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleziona fotocamera
        </label>
        <select
          value={selectedCamera}
          onChange={(e) => setSelectedCamera(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          disabled={scanning}
        >
          {cameras.length === 0 && (
            <option value="">Nessuna fotocamera trovata</option>
          )}
          {cameras.map((cam) => (
            <option key={cam.id} value={cam.id}>
              {cam.label}
            </option>
          ))}
        </select>
      </div>

      {/* Scanner */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div
          id="qr-reader"
          key={qrReaderKey}
          style={{ width: '100%', minHeight: '300px' }}
        />

        <div className="mt-4 flex justify-center gap-4">
          {!scanning ? (
            <button
              onClick={startScanning}
              disabled={!selectedCamera}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
            >
              Avvia scansione
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Ferma scansione
            </button>
          )}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`p-6 rounded-xl border ${
            result.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          {result.success ? (
            <>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                {result.type === 'deliver' ? 'Consegna registrata!' : 'Ritiro completato!'}
              </h3>
              <p className="text-green-700 mb-2">{result.message}</p>
              {result.objectTitle && (
                <p className="text-sm text-green-600">
                  Oggetto: <strong>{result.objectTitle}</strong>
                </p>
              )}
              {result.recipientName && (
                <p className="text-sm text-green-600">
                  {result.type === 'deliver' ? 'Donatore' : 'Beneficiario'}: <strong>{result.recipientName}</strong>
                </p>
              )}
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Errore
              </h3>
              <p className="text-red-700">{result.message}</p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-2">Istruzioni</h3>
        <ol className="text-sm text-gray-600 space-y-2">
          <li>1. Seleziona la fotocamera</li>
          <li>2. Clicca su &quot;Avvia scansione&quot;</li>
          <li>3. Inquadra il QR code</li>
          <li>4. Il sistema riconosce automaticamente se è una consegna o un ritiro</li>
        </ol>
      </div>
    </div>
  );
}