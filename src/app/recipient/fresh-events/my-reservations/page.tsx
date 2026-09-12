'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Apple, Calendar, MapPin, ArrowLeft } from 'lucide-react';
import { Card, CardContent, Badge, Button, EmptyState, Spinner, SectionDivider } from '@/components/ui';
import { toast } from '@/components/ui/Toast';

interface Reservation {
  id: string;
  status: 'CONFIRMED' | 'WAITING' | 'ADMITTED' | 'PICKED_UP' | 'NO_SHOW' | 'CANCELLED' | 'EXPIRED';
  position: number | null;
  reservedAt: string;
  admittedAt: string | null;
  pickedUpAt: string | null;
  cancelledAt: string | null;
  freshEvent: {
    id: string;
    scheduledStart: string;
    scheduledEnd: string;
    pickupInstructions: string | null;
    status: string;
    template: { id: string; title: string; description: string | null };
    pickupLocation: { id: string; address: string; city: string } | null;
  };
}

function statusBadge(s: Reservation['status']) {
  switch (s) {
    case 'CONFIRMED': return { variant: 'success' as const, label: 'Confermato' };
    case 'WAITING': return { variant: 'info' as const, label: 'In lista' };
    case 'ADMITTED': return { variant: 'success' as const, label: 'Ammesso' };
    case 'PICKED_UP': return { variant: 'default' as const, label: 'Ritirato' };
    case 'NO_SHOW': return { variant: 'danger' as const, label: 'No-show' };
    case 'CANCELLED': return { variant: 'default' as const, label: 'Annullata' };
    case 'EXPIRED': return { variant: 'default' as const, label: 'Scaduta' };
  }
}

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const res = await fetch('/api/recipient/fresh-events/my-reservations');
      if (!res.ok) throw new Error('Errore');
      const data = await res.json();
      setReservations(data.reservations || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (reservationId: string) => {
    if (!confirm('Cancellare questa prenotazione?')) return;
    try {
      const res = await fetch(`/api/recipient/fresh-events/reservation/${reservationId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore');
      }
      toast.success('Prenotazione cancellata');
      fetchReservations();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const active = reservations.filter((r) => ['CONFIRMED', 'WAITING', 'ADMITTED'].includes(r.status));
  const past = reservations.filter((r) => !['CONFIRMED', 'WAITING', 'ADMITTED'].includes(r.status));

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      <Link href="/recipient/fresh-events" className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Torna alla lista
      </Link>

      <div className="flex items-center gap-2">
        <Apple className="h-6 w-6 text-green-600" aria-hidden="true" />
        <h1 className="text-2xl font-bold">Le mie prenotazioni</h1>
      </div>

      {active.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Attive</h2>
          <div className="grid gap-3">
            {active.map((r) => {
              const badge = statusBadge(r.status);
              return (
                <Card key={r.id}>
                  <CardContent className="pt-4 space-y-2 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold">{r.freshEvent.template.title}</div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                      <span>{new Date(r.freshEvent.scheduledStart).toLocaleString('it-IT', { dateStyle: 'full', timeStyle: 'short' })}</span>
                    </div>
                    {r.freshEvent.pickupLocation && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        <span>{r.freshEvent.pickupLocation.address}, {r.freshEvent.pickupLocation.city}</span>
                      </div>
                    )}
                    {r.position && (
                      <p className="text-xs text-amber-700">Posizione in lista: {r.position}</p>
                    )}
                    <div className="flex gap-2 pt-2">
                      {(r.status === 'CONFIRMED' || r.status === 'ADMITTED') && (
                        <Link href={`/recipient/fresh-events/reservation/${r.id}/qr`}>
                          <Button size="sm" variant="primary">Mostra QR</Button>
                        </Link>
                      )}
                      <Button size="sm" variant="danger" onClick={() => handleCancel(r.id)}>
                        Cancella
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {active.length > 0 && past.length > 0 && <SectionDivider label="Storico" count={past.length} color="info" />}

      {past.length > 0 && (
        <section>
          <div className="grid gap-3">
            {past.map((r) => {
              const badge = statusBadge(r.status);
              return (
                <Card key={r.id}>
                  <CardContent className="pt-4 space-y-1 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium">{r.freshEvent.template.title}</div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(r.freshEvent.scheduledStart).toLocaleDateString('it-IT', { dateStyle: 'long' })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {reservations.length === 0 && (
        <EmptyState
          title="Nessuna prenotazione"
          description="Non hai ancora prenotato slot di prodotti freschi."
        />
      )}
    </div>
  );
}
