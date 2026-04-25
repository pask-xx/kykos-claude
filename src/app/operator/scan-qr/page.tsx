'use client';

import { useState, useEffect, useRef } from 'react';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [qrReaderKey, setQrReaderKey] = useState(0);

  useEffect(() => {
    // List cameras
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setCameras(videoDevices.map(d => ({ id: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0,8)}` })));
      if (videoDevices.length > 0) setSelectedCamera(videoDevices[0].deviceId);
    }).catch((err) => {
      console.error('Camera error:', err);
      setError('Impossibile accedere alla fotocamera');
    });

    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startScanning = async () => {
    setScanning(true);
    setResult(null);
    setError(null);
    setQrReaderKey(prev => prev + 1);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedCamera ? { exact: selectedCamera } : undefined },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start QR detection loop
      detectQRCode();
    } catch (err) {
      console.error('Camera error:', err);
      setError('Errore nell\'avvio della fotocamera');
      setScanning(false);
    }
  };

  const detectQRCode = async () => {
    if (!videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const checkFrame = async () => {
      if (!scanning || !streamRef.current) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          // @ts-ignore
          const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await barcodeDetector.detect(canvas);

          if (barcodes && barcodes.length > 0) {
            const qrData = barcodes[0].rawValue;
            await handleScanResult(qrData);
            return;
          }
        } catch (e) {
          // BarcodeDetector not supported, try jsQR
          try {
            const { default: jsQR } = await import('jsqr');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
              await handleScanResult(code.data);
              return;
            }
          } catch (e2) {
            // jsQR not available either
          }
        }
      }

      if (scanning) {
        requestAnimationFrame(checkFrame);
      }
    };

    requestAnimationFrame(checkFrame);
  };

  const handleScanResult = async (qrData: string) => {
    stopCamera();
    setScanning(false);

    const res = await fetch('/api/operator/scan-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrData }),
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
  };

  const stopScanning = () => {
    stopCamera();
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
        <div className="relative bg-black" style={{ minHeight: '300px' }}>
          <video
            key={qrReaderKey}
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ minHeight: '300px' }}
            playsInline
            muted
          />
          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-white rounded-lg"></div>
            </div>
          )}
        </div>

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