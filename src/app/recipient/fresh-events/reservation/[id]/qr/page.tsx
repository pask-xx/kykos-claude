'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Apple, Calendar, MapPin, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Alert, Spinner, Button } from '@/components/ui';

interface QrData {
  reservationId: string;
  qrCode: string;
  qrCodeImageUrl: string | null;
  event: {
    scheduledStart: string;
    scheduledEnd: string;
    pickupInstructions: string | null;
    template: { id: string; title: string };
  };
}

export default function FreshReservationQrPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<QrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQr();
  }, [params.id]);

  const fetchQr = async () => {
    try {
      const res = await fetch(`/api/recipient/fresh-events/reservation/${params.id}/qr`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Errore');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-md flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <Alert type="error">{error || 'QR non disponibile'}</Alert>
        <Link href="/recipient/fresh-events/my-reservations" className="text-sm text-primary-600 hover:underline mt-4 block">
          Torna alle mie prenotazioni
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-md space-y-4">
      <Link href="/recipient/fresh-events/my-reservations" className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Le mie prenotazioni
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-green-600" aria-hidden="true" />
            <CardTitle className="text-base">{data.event.template.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <div>
              <div>{new Date(data.event.scheduledStart).toLocaleString('it-IT', { dateStyle: 'full', timeStyle: 'short' })}</div>
              <div className="text-xs text-gray-500">fino alle {new Date(data.event.scheduledEnd).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          {data.qrCodeImageUrl ? (
            <div className="bg-white p-4 rounded border text-center">
              <p className="text-xs text-gray-500 mb-3">Mostra questo QR all&apos;operatore al ritiro</p>
              <img
                src={data.qrCodeImageUrl}
                alt="QR Code ritiro prodotti freschi"
                className="mx-auto w-64 h-64"
              />
              <p className="font-mono text-[10px] mt-3 break-all text-gray-400">{data.qrCode}</p>
            </div>
          ) : (
            <Alert type="warning">Immagine QR non disponibile. Usa il codice testuale qui sotto.</Alert>
          )}

          {data.event.pickupInstructions && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded text-blue-900 text-sm">
              <strong>Istruzioni:</strong> {data.event.pickupInstructions}
            </div>
          )}

          <Button onClick={handlePrint} variant="primary" className="w-full">
            Stampa QR
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
