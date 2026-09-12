'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Apple, Calendar, MapPin, Users, AlertTriangle, ArrowLeft, Hourglass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Alert, Spinner } from '@/components/ui';
import { toast } from '@/components/ui/Toast';

interface EventDetail {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  capacity: number;
  reservedCount: number;
  waitingCount: number;
  pickupInstructions: string | null;
  status: string;
  template: { id: string; title: string; description: string | null };
  pickupLocation: { id: string; address: string; city: string; postalCode: string } | null;
  myReservation: {
    id: string;
    status: string;
    position: number | null;
    qrCode: string | null;
  } | null;
  canReserve: { ok: boolean; reason?: string; message?: string };
}

export default function FreshEventDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [params.id]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/recipient/fresh-events/${params.id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore');
      }
      const data = await res.json();
      setEvent(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async () => {
    if (!event) return;
    if (!confirm('Confermi la prenotazione?')) return;
    setReserving(true);
    try {
      const res = await fetch(`/api/recipient/fresh-events/${event.id}/reserve`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore nella prenotazione');
      }
      const data = await res.json();
      if (data.type === 'CONFIRMED') {
        toast.success('Prenotazione confermata! QR code generato.');
        router.push(`/recipient/fresh-events/reservation/${data.reservationId}/qr`);
      } else if (data.type === 'WAITING') {
        toast.info(`Sei in lista d'attesa (posizione ${data.position}). Ti avviseremo se si libera un posto.`);
        router.push('/recipient/fresh-events');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Alert type="error">Evento non trovato</Alert>
      </div>
    );
  }

  const freeSlots = event.capacity - event.reservedCount;

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-4">
      <Link href="/recipient/fresh-events" className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Torna alla lista
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-2">
            <Apple className="h-6 w-6 text-green-600 mt-1" aria-hidden="true" />
            <div>
              <CardTitle>{event.template.title}</CardTitle>
              {event.template.description && (
                <p className="text-sm text-gray-600 mt-1">{event.template.description}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <div>
              <div>{new Date(event.scheduledStart).toLocaleString('it-IT', { dateStyle: 'full', timeStyle: 'short' })}</div>
              <div className="text-xs text-gray-500">fino alle {new Date(event.scheduledEnd).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          {event.pickupLocation && (
            <div className="flex items-start gap-2 text-gray-700">
              <MapPin className="h-4 w-4 mt-0.5" aria-hidden="true" />
              <div>
                <div>{event.pickupLocation.address}</div>
                <div className="text-xs">{event.pickupLocation.postalCode} {event.pickupLocation.city}</div>
              </div>
            </div>
          )}

          {event.status === 'PUBLISHED' && (
            <div className="flex items-center gap-2 text-gray-700">
              <Users className="h-4 w-4" aria-hidden="true" />
              <span>{freeSlots} {freeSlots === 1 ? 'posto libero' : 'posti liberi'} su {event.capacity}</span>
            </div>
          )}

          {event.status === 'FULL' && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded text-amber-900 flex items-start gap-2">
              <Hourglass className="h-4 w-4 mt-0.5" aria-hidden="true" />
              <div>
                <div className="font-semibold">Posti esauriti</div>
                <div className="text-xs">Coda attiva: {event.waitingCount} {event.waitingCount === 1 ? 'persona in lista' : 'persone in lista'}</div>
              </div>
            </div>
          )}

          {event.pickupInstructions && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded text-blue-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5" aria-hidden="true" />
              <div className="text-sm">{event.pickupInstructions}</div>
            </div>
          )}

          {event.myReservation ? (
            <div className="space-y-3 pt-3 border-t">
              <div>
                <Badge variant="success">Hai già una prenotazione</Badge>
                <p className="text-sm text-gray-600 mt-2">
                  Stato: <strong>{event.myReservation.status}</strong>
                  {event.myReservation.position && ` (posizione ${event.myReservation.position})`}
                </p>
              </div>
              <div className="flex gap-2">
                {(event.myReservation.status === 'CONFIRMED' ||
                  event.myReservation.status === 'ADMITTED' ||
                  event.myReservation.status === 'PICKED_UP') && (
                  <Link href={`/recipient/fresh-events/reservation/${event.myReservation.id}/qr`}>
                    <Button variant="primary">Mostra QR code</Button>
                  </Link>
                )}
              </div>
            </div>
          ) : event.canReserve.ok ? (
            <div className="pt-3 border-t">
              <Button
                variant="primary"
                onClick={handleReserve}
                loading={reserving}
                className="w-full"
              >
                {event.status === 'FULL' ? 'Mettimi in lista d\'attesa' : 'Prenota questo slot'}
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {event.status === 'FULL'
                  ? 'Se un posto si libera, ti verra inviato il QR code.'
                  : 'Prenotando ora, riceverai subito il QR code da mostrare al ritiro.'}
              </p>
            </div>
          ) : (
            <Alert type="warning">
              {event.canReserve.message || 'Non puoi prenotare questo slot'}
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
