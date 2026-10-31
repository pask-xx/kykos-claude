'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Camera, QrCode } from 'lucide-react';
import { Button } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { formatShelfLocation } from '@/lib/shelf-label';

/**
 * Scanner dell'etichetta di scaffale (QR).
 *
 * Usato sia nella creazione di una disponibilità sia nella modifica:
 * la posizione di deposito si legge fisicamente dall'etichetta, non si
 * digita a mano.
 */

export interface ShelfLabelScannerProps {
  /** Chiamata con la posizione normalizzata letta dall'etichetta. */
  onScan: (location: string) => void;
  /** Testo del bottone. */
  label?: string;
}

/** La camera posteriore è quella giusta per inquadrare lo scaffale. */
function isBackCamera(label: string): boolean {
  const l = label.toLowerCase();
  return l.includes('back') || l.includes('rear') || l.includes('environment');
}

export function ShelfLabelScanner({
  onScan,
  label = 'Scansiona etichetta scaffale',
}: ShelfLabelScannerProps) {
  const [open, setOpen] = useState(false);
  const [cameraId, setCameraId] = useState<string | undefined>(undefined);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  // Callback in un ref: evita di ricreare lo scanner a ogni render del parent.
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current = null;
    }
    setOpen(false);
  }, []);

  // Scelta della camera (preferisce quella posteriore).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;
        const videoDevices = devices
          .filter((d) => d.kind === 'videoinput')
          .map((d) => ({
            id: d.deviceId,
            label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
          }));
        if (videoDevices.length === 0) return;
        const back = videoDevices.find((d) => isBackCamera(d.label));
        setCameraId(back ? back.id : videoDevices[0].id);
      } catch (err) {
        console.error('Error getting cameras:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Avvio/arresto dello scanner.
  useEffect(() => {
    if (open && videoRef.current && cameraId) {
      const scanner = new QrScanner(
        videoRef.current,
        (scanResult) => {
          const data = typeof scanResult === 'string' ? scanResult : scanResult.data;
          scanner.stop();
          setOpen(false);
          onScanRef.current(formatShelfLocation(data));
          toast.success('Posizione di deposito letta dall\'etichetta');
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          maxScansPerSecond: 5,
        }
      );
      scannerRef.current = scanner;
      scanner
        .setCamera(cameraId)
        .then(() => scanner.start())
        .catch((err) => {
          console.error('Scanner error:', err);
          toast.error("Errore nell'avvio della fotocamera");
        });
    } else if (!open && scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current = null;
    }
  }, [open, cameraId]);

  // Alla dismissione la fotocamera va spenta.
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto"
        leftIcon={<QrCode className="w-4 h-4" aria-hidden="true" />}
      >
        {label}
      </Button>

      {open && (
        <div className="rounded-lg overflow-hidden border border-gray-200 mt-2">
          <video ref={videoRef} className="w-full h-64 object-cover bg-black" />
          <div className="p-2 text-center">
            <Button
              type="button"
              variant="secondary"
              onClick={stopScanner}
              leftIcon={<Camera className="w-4 h-4" aria-hidden="true" />}
            >
              Annulla scansione
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
