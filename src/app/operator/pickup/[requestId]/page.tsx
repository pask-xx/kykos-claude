'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import QrScanner from 'qr-scanner';

interface PickupData {
  title: string;
  depositLocation: string;
  depositNotes: string | null;
  objectId: string;
  recipientId: string;
  recipientName: string;
}

interface CameraDevice {
  id: string;
  label: string;
  kind: 'videoinput';
}

export default function PickupLocationPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;

  const [loading, setLoading] = useState(true);
  const [pickupData, setPickupData] = useState<PickupData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [verified, setVerified] = useState(false);
  const [showVerifyScanner, setShowVerifyScanner] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [cameraId, setCameraId] = useState<string>('');
  const [cameras, setCameras] = useState<CameraDevice[]>([]);

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
    fetchRequestData();
    getCameras();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current = null;
      }
    };
  }, [requestId]);

  const getCameras = async () => {
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
  };

  const fetchRequestData = async () => {
    try {
      const res = await fetch(`/api/operator/requests/${requestId}/pickup`);
      if (res.ok) {
        const data = await res.json();
        setPickupData({
          title: data.title,
          depositLocation: data.depositLocation,
          depositNotes: data.depositNotes || null,
          objectId: data.objectId,
          recipientId: data.recipientId,
          recipientName: data.recipientName,
        });
      } else {
        const data = await res.json();
        setError(data.error || 'Richiesta non trovata');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const startVerifyScanner = async () => {
    if (!videoRef.current) return;

    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current = null;
      }

      const scanner = new QrScanner(videoRef.current, (scanResult) => {
        const data = typeof scanResult === 'string' ? scanResult : scanResult.data;
        scanner.stop();
        setShowVerifyScanner(false);

        console.log('QR scanned for verification:', data);
        console.log('Expected requestId:', requestId);
        console.log('Expected objectId (as donorId):', pickupData?.objectId);

        // Verify this is the correct object's deliver QR
        // Format: kykos:object:deliver:{requestId}:{userId}
        if (data.startsWith('kykos:object:deliver:')) {
          const parts = data.split(':');
          const qrRequestId = parts[3];
          const qrUserId = parts[4];

          console.log('QR parts - requestId:', qrRequestId, 'userId:', qrUserId);

          // Verify requestId matches and userId matches objectId (stored as donorId)
          if (qrRequestId === requestId && pickupData && qrUserId === pickupData.objectId) {
            setVerified(true);
            setVerifyError(null);
          } else {
            setVerifyError(`QR code non corrisponde. Ricevuto: requestId=${qrRequestId}, userId=${qrUserId}`);
          }
        } else {
          setVerifyError('QR code non valido per la verifica oggetto. Formato atteso: kykos:object:deliver:...');
        }
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
      setVerifyError('Errore nell\'avvio della fotocamera');
    }
  };

  const stopVerifyScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current = null;
    }
    setShowVerifyScanner(false);
  };

  useEffect(() => {
    if (showVerifyScanner && videoRef.current && cameraId) {
      startVerifyScanner();
    } else {
      stopVerifyScanner();
    }
  }, [showVerifyScanner, cameraId]);

  const handleCompletePickup = async () => {
    setCompleting(true);
    try {
      const res = await fetch(`/api/operator/scan-qr/pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      if (res.ok) {
        setCompleted(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Errore durante il completamento');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (error && !pickupData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <button
              onClick={() => router.push('/operator/scan-qr')}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Torna alla scansione
            </button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-xl">
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-red-700 mb-2">Errore</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8 max-w-xl">
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center space-y-6">
            <div className="text-5xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-green-700">Ritiro Completato!</h1>
            <p className="text-gray-600">
              Il beneficiario ha ritirato l&apos;oggetto con successo.
            </p>
            <button
              onClick={() => router.push('/operator/scan-qr')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              ← Torna alla scansione
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/operator/scan-qr')}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Annulla
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-xl">
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          {/* Pickup Info */}
          <div className="text-center">
            <div className="text-5xl mb-4">📦</div>
            <h1 className="text-2xl font-bold text-gray-900">Ritiro Oggetto</h1>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {pickupData && (
            <>
              {/* Object Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="font-semibold text-gray-900 mb-2">{pickupData.title}</h2>
                <p className="text-sm text-gray-600">
                  Per: <strong>{pickupData.recipientName}</strong>
                </p>
              </div>

              {/* Deposit Location */}
              {pickupData.depositLocation ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-center mb-4">
                    <span className="text-4xl">📍</span>
                  </div>
                  <h3 className="text-lg font-semibold text-center text-green-800 mb-2">
                    Posizione oggetto
                  </h3>
                  <p className="text-2xl font-bold text-center text-green-900">
                    {pickupData.depositLocation}
                  </p>
                  {pickupData.depositNotes && (
                    <p className="text-sm text-center text-green-700 mt-2">
                      Note: {pickupData.depositNotes}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-4">⚠️</div>
                  <h3 className="font-semibold text-amber-800 mb-2">
                    Posizione non registrata
                  </h3>
                  <p className="text-sm text-amber-600">
                    L&apos;operatore non ha ancora registrato la posizione di deposito.
                    <br />
                    Assicurati che l&apos;oggetto sia disponibile prima di procedere.
                  </p>
                </div>
              )}

              {/* Verification Section (Optional) */}
              <div className="border-2 border-dashed rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-700">Verifica oggetto (opzionale)</span>
                  {verified ? (
                    <span className="text-green-600 font-semibold flex items-center gap-1">
                      ✓ Verificato
                    </span>
                  ) : null}
                </div>

                <p className="text-sm text-gray-500 mb-3">
                  Puoi scansionare il QR code sull&apos;oggetto per verificare che sia quello corretto
                </p>
                <button
                  type="button"
                  onClick={() => setShowVerifyScanner(!showVerifyScanner)}
                  className={`w-full py-3 rounded-lg font-medium ${
                    showVerifyScanner
                      ? 'bg-gray-200 text-gray-700'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  📷 {showVerifyScanner ? 'Annulla scansione' : 'Scansiona QR oggetto'}
                </button>

                {showVerifyScanner && (
                  <div className="mt-4 border-2 border-dashed border-gray-300 rounded-lg p-4">
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
                  </div>
                )}

                {verifyError && (
                  <p className="mt-2 text-sm text-red-600">{verifyError}</p>
                )}
              </div>

              {/* Complete Pickup Button */}
              <div className="space-y-4">
                <button
                  onClick={handleCompletePickup}
                  disabled={completing}
                  className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-lg disabled:opacity-50"
                >
                  {completing ? 'Elaborazione...' : 'Conferma Ritiro Completato'}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Puoi verificare l&apos;oggetto con il QR code oppure procedere direttamente
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}