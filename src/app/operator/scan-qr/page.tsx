'use client';

import { useState, useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';

interface CameraDevice {
  id: string;
  label: string;
  kind: 'videoinput';
}

interface ScanResult {
  success: boolean;
  message: string;
  objectTitle?: string;
  recipientName?: string;
  depositLocation?: string;
  type?: string;
}

export default function ScanQrPage() {
  const [scanning, setScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraLoading, setCameraLoading] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [pendingQrData, setPendingQrData] = useState<string | null>(null);
  const [depositLocation, setDepositLocation] = useState('');
  const scannerRef = useRef<QrScanner | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
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

        const backCamera = videoDevices.find(c =>
          c.label.toLowerCase().includes('back') ||
          c.label.toLowerCase().includes('rear') ||
          c.label.toLowerCase().includes('environment')
        );
        const frontCamera = videoDevices.find(c =>
          c.label.toLowerCase().includes('front') ||
          c.label.toLowerCase().includes('face')
        );

        if (backCamera) setSelectedCameraId(backCamera.id);
        else if (frontCamera) setSelectedCameraId(frontCamera.id);
        else if (videoDevices.length > 0) setSelectedCameraId(videoDevices[0].id);
      } catch (err) {
        setError('Non è possibile accedere alla fotocamera. Assicurati di aver dato i permessi.');
      }
    }

    getCameras();
  }, []);

  const startScanning = async () => {
    setShowCamera(true);
    setCameraLoading(true);
    setError(null);
    setResult(null);

    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current = null;
      }

      // Wait for video element to be available
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!videoRef.current) {
        throw new Error('Video element not available');
      }

      const scanner = new QrScanner(videoRef.current, (scanResult) => {
        const qrData = typeof scanResult === 'string' ? scanResult : scanResult.data;

        scanner.stop();
        setScanning(false);
        setShowCamera(false);

        if (qrData.includes('"type":"deliver"') || qrData.includes('"type":"pickup"')) {
          const parsed = JSON.parse(qrData);
          if (parsed.type === 'deliver') {
            setPendingQrData(qrData);
            setShowDepositModal(true);
            return;
          }
        }

        processScan(qrData);
      }, {
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 10,
      });

      scannerRef.current = scanner;

      if (selectedCameraId) {
        await scanner.setCamera(selectedCameraId);
      }
      await scanner.start();

      setScanning(true);
    } catch (err) {
      setError('Errore nell\'avvio della fotocamera');
      setShowCamera(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current = null;
    }
    setScanning(false);
    setShowCamera(false);
  };

  const processScan = (qrData: string, depositLoc?: string) => {
    fetch('/api/operator/scan-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrData, depositLocation: depositLoc }),
    })
    .then(res => res.json())
    .then(data => {
      setResult({
        success: data.success || false,
        message: data.message || 'Errore sconosciuto',
        objectTitle: data.data?.objectTitle,
        recipientName: data.data?.recipientName,
        depositLocation: data.data?.depositLocation,
        type: data.type,
      });
    })
    .catch(err => {
      setResult({ success: false, message: 'Errore di connessione' });
    });
  };

  const handleDepositConfirm = () => {
    if (pendingQrData) {
      processScan(pendingQrData, depositLocation);
      setShowDepositModal(false);
      setPendingQrData(null);
      setDepositLocation('');
    }
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
          Fotocamera ({cameras.length} trovate)
        </label>
        <select
          value={selectedCameraId}
          onChange={(e) => setSelectedCameraId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          disabled={scanning}
        >
          {cameras.length === 0 && (
            <option value="">Caricamento...</option>
          )}
          {cameras.map((cam, i) => (
            <option key={cam.id} value={cam.id}>
              {cam.label} ({i === 0 ? 'Frontale' : 'Posteriore'})
            </option>
          ))}
        </select>
      </div>

      {/* Scanner - only visible when actively scanning */}
      {showCamera && (
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div
            className="relative overflow-hidden rounded-lg bg-black"
            style={{ minHeight: '300px' }}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              style={{ minHeight: '300px' }}
              playsInline
              muted
            />
          </div>

          <div className="mt-4 flex justify-center gap-4">
            <button
              onClick={stopScanning}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Ferma scansione
            </button>
          </div>
        </div>
      )}

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
              {result.depositLocation && (
                <p className="text-sm text-green-600 mt-1">
                  Posizione: <strong>{result.depositLocation}</strong>
                </p>
              )}
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Errore</h3>
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

      {/* Deposit Location Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Posizione di deposito</h3>
            <p className="text-sm text-gray-600 mb-4">
              Inserisci la posizione dove l&apos;oggetto verrà depositato (es. scaffale, corridoio, etc.)
            </p>
            <input
              type="text"
              value={depositLocation}
              onChange={(e) => setDepositLocation(e.target.value)}
              placeholder="Es. Scaffale A-12"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDepositModal(false); setPendingQrData(null); setDepositLocation(''); }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleDepositConfirm}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-2">Istruzioni</h3>
        <ol className="text-sm text-gray-600 space-y-2">
          <li>1. Seleziona la fotocamera dal menu</li>
          <li>2. Clicca su &quot;Avvia scansione&quot;</li>
          <li>3. Inquadra il QR code di consegna o ritiro</li>
          <li>4. Per consegne, inserisci la posizione di deposito (scaffale)</li>
          <li>5. Il sistema riconosce automaticamente se è una consegna o un ritiro</li>
        </ol>
      </div>
    </div>
  );
}
