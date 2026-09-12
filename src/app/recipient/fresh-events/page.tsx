'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Apple, MapPin, Calendar, Users, AlertTriangle, Hourglass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Alert, EmptyState, Spinner, SectionDivider } from '@/components/ui';
import { toast } from '@/components/ui/Toast';

interface FreshEvent {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  capacity: number;
  reservedCount: number;
  waitingCount: number;
  pickupInstructions: string | null;
  status: 'PUBLISHED' | 'FULL' | 'CLOSED' | 'COMPLETED' | 'CANCELLED';
  template: { id: string; title: string; description: string | null; startTime: string; endTime: string };
  pickupLocation: { id: string; address: string; city: string; postalCode: string } | null;
  myReservation: {
    id: string;
    status: 'CONFIRMED' | 'WAITING' | 'ADMITTED' | 'PICKED_UP' | 'NO_SHOW' | 'CANCELLED' | 'EXPIRED';
    position: number | null;
    qrCode: string | null;
  } | null;
}

interface FreshTemplate {
  id: string;
  title: string;
  description: string | null;
  weekday: number;
  startTime: string;
  endTime: string;
  capacity: number;
  isSubscribed: boolean;
  upcomingSlotsCount: number;
}

const WEEKDAY_LABELS = ['Domenica', 'Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato'];

function eventStatusBadge(s: FreshEvent['status']) {
  switch (s) {
    case 'PUBLISHED': return { variant: 'success' as const, label: 'Posti disponibili' };
    case 'FULL': return { variant: 'warning' as const, label: 'Lista attesa' };
    case 'CLOSED': return { variant: 'default' as const, label: 'Chiuso' };
    case 'COMPLETED': return { variant: 'default' as const, label: 'Concluso' };
    case 'CANCELLED': return { variant: 'danger' as const, label: 'Annullato' };
  }
}

function reservationStatusBadge(s: NonNullable<FreshEvent['myReservation']>['status']) {
  switch (s) {
    case 'CONFIRMED': return { variant: 'success' as const, label: 'Confermato - Mostra QR' };
    case 'WAITING': return { variant: 'info' as const, label: 'In lista attesa' };
    case 'ADMITTED': return { variant: 'success' as const, label: 'Ammesso - Mostra QR' };
    case 'PICKED_UP': return { variant: 'default' as const, label: 'Ritirato' };
    case 'NO_SHOW': return { variant: 'danger' as const, label: 'No-show' };
    case 'CANCELLED': return { variant: 'default' as const, label: 'Annullato' };
    case 'EXPIRED': return { variant: 'default' as const, label: 'Scaduto' };
  }
}

export default function FreshEventsPage() {
  const [events, setEvents] = useState<FreshEvent[]>([]);
  const [templates, setTemplates] = useState<FreshTemplate[]>([]);
  const [suspended, setSuspended] = useState(false);
  const [suspendedUntil, setSuspendedUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [eventsRes, templatesRes] = await Promise.all([
        fetch('/api/recipient/fresh-events'),
        fetch('/api/recipient/fresh-events/templates'),
      ]);
      if (!eventsRes.ok) throw new Error('Errore nel caricamento');
      const eventsData = await eventsRes.json();
      const templatesData = templatesRes.ok ? await templatesRes.json() : { templates: [] };

      setEvents(eventsData.events || []);
      setSuspended(eventsData.suspended || false);
      setSuspendedUntil(eventsData.suspendedUntil || null);
      setTemplates(templatesData.templates || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubscribe = async (templateId: string, currentlySubscribed: boolean) => {
    try {
      const res = await fetch(`/api/recipient/fresh-events/templates/${templateId}/subscribe`, {
        method: currentlySubscribed ? 'DELETE' : 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore');
      }
      toast.success(currentlySubscribed ? 'Disiscritto' : 'Iscritto! Riceverai le notifiche dei nuovi slot');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('Vuoi cancellare la prenotazione? Libererai il posto per un altro beneficiario.')) return;
    try {
      const res = await fetch(`/api/recipient/fresh-events/reservation/${reservationId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore');
      }
      toast.success('Prenotazione cancellata');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Alert type="error">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      <div className="flex items-center gap-2">
        <Apple className="h-6 w-6 text-green-600" aria-hidden="true" />
        <h1 className="text-2xl font-bold">Prodotti Freschi</h1>
      </div>

      {suspended && suspendedUntil && (
        <Alert type="warning" title="Sospensione attiva">
          Non puoi prenotare prodotti freschi fino al {new Date(suspendedUntil).toLocaleDateString('it-IT')}.
          Per evitare future sospensioni, cancella sempre la prenotazione in anticipo se non puoi venire.
        </Alert>
      )}

      {/* Sezione template ricorrenti (iscrizioni) */}
      {templates.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Iscrizioni ricorrenti</h2>
          <p className="text-sm text-gray-600 mb-4">
            Iscriviti per ricevere una notifica ogni volta che il tuo ente pubblica un nuovo slot di questa tipologia.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {templates.map((t) => (
              <Card key={t.id}>
                <CardHeader>
                  <CardTitle className="text-base">{t.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {t.description && <p className="text-gray-600">{t.description}</p>}
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    <span>{WEEKDAY_LABELS[t.weekday]} {t.startTime}-{t.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    <span>{t.capacity} posti per slot</span>
                  </div>
                  {t.upcomingSlotsCount > 0 && (
                    <Badge variant="primary">
                      {t.upcomingSlotsCount} {t.upcomingSlotsCount === 1 ? 'slot disponibile' : 'slot disponibili'}
                    </Badge>
                  )}
                  <Button
                    variant={t.isSubscribed ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => handleSubscribe(t.id, t.isSubscribed)}
                    className="w-full mt-2"
                  >
                    {t.isSubscribed ? 'Disiscriviti' : 'Iscriviti'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {templates.length > 0 && events.length > 0 && <SectionDivider label="Slot pubblicati" count={events.length} color="info" />}

      {/* Sezione slot pubblicati futuri */}
      {events.length === 0 ? (
        <EmptyState
          title="Nessuno slot disponibile"
          description="Non ci sono slot pubblicati al momento. Iscriviti ai template per essere avvisato quando ne vengono pubblicati di nuovi."
        />
      ) : (
        <div className="grid gap-4">
          {events.map((event) => {
            const statusBadge = eventStatusBadge(event.status);
            const freeSlots = event.capacity - event.reservedCount;
            return (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{event.template.title}</CardTitle>
                    <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {new Date(event.scheduledStart).toLocaleString('it-IT', { dateStyle: 'full', timeStyle: 'short' })}
                    </span>
                  </div>
                  {event.pickupLocation && (
                    <div className="flex items-start gap-2 text-gray-700">
                      <MapPin className="h-4 w-4 mt-0.5" aria-hidden="true" />
                      <span>{event.pickupLocation.address}, {event.pickupLocation.city}</span>
                    </div>
                  )}
                  {event.status === 'PUBLISHED' && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Users className="h-4 w-4" aria-hidden="true" />
                      <span>{freeSlots} {freeSlots === 1 ? 'posto libero' : 'posti liberi'}</span>
                    </div>
                  )}
                  {event.status === 'FULL' && event.waitingCount > 0 && (
                    <div className="flex items-center gap-2 text-amber-700">
                      <Hourglass className="h-4 w-4" aria-hidden="true" />
                      <span>{event.waitingCount} {event.waitingCount === 1 ? 'persona in lista' : 'persone in lista'}</span>
                    </div>
                  )}
                  {event.pickupInstructions && (
                    <div className="bg-amber-50 p-2 rounded text-amber-900 text-xs">
                      <AlertTriangle className="h-3 w-3 inline mr-1" aria-hidden="true" />
                      {event.pickupInstructions}
                    </div>
                  )}

                  {event.myReservation ? (
                    <div className="space-y-2 pt-2 border-t">
                      <Badge variant={reservationStatusBadge(event.myReservation.status).variant}>
                        {reservationStatusBadge(event.myReservation.status).label}
                      </Badge>
                      {event.myReservation.position && (
                        <p className="text-xs text-gray-600">Posizione in lista: {event.myReservation.position}</p>
                      )}
                      <div className="flex gap-2">
                        {(event.myReservation.status === 'CONFIRMED' ||
                          event.myReservation.status === 'ADMITTED' ||
                          event.myReservation.status === 'PICKED_UP') && (
                          <Link href={`/recipient/fresh-events/reservation/${event.myReservation.id}/qr`}>
                            <Button size="sm" variant="primary">Mostra QR</Button>
                          </Link>
                        )}
                        {(event.myReservation.status === 'CONFIRMED' ||
                          event.myReservation.status === 'WAITING' ||
                          event.myReservation.status === 'ADMITTED') && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleCancelReservation(event.myReservation!.id)}
                          >
                            Cancella
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Link href={`/recipient/fresh-events/${event.id}`}>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={suspended}
                        className="w-full mt-2"
                      >
                        {suspended ? 'Sospeso' : 'Prenota'}
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="text-center pt-4">
        <Link href="/recipient/fresh-events/my-reservations" className="text-sm text-primary-600 hover:underline">
          Vedi le mie prenotazioni →
        </Link>
      </div>
    </div>
  );
}
