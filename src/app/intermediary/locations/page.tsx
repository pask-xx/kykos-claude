'use client';

import { useState, useEffect, useId } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Power, MapPin, Building2, Crosshair, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Form, Field, TextAreaField } from '@/components/ui/Form';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { MultiDayHoursEditor } from '@/components/location/MultiDayHoursEditor';
import { normalizeLocationHours } from '@/lib/location-validation';
import LocationMap from '@/components/map/LocationMap';
import type { LocationHours } from '@/types';
import { LOCATION_DAY_KEYS, LOCATION_DAY_LABELS } from '@/types';

interface Location {
  id: string;
  organizationId: string;
  kind: 'COLLECTION_POINT';
  address: string;
  city: string;
  postalCode: string;
  province: string | null;
  country: string;
  latitude: number;
  longitude: number;
  hours: LocationHours | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { operatorLocations: number };
}

// Form schema (zod, client-side, mirror di location-validation.ts).
// `hours` NON è incluso: gestito in state locale separato via MultiDayHoursEditor (controlled).
// `notes` è stringa opzionale, max 2000 caratteri.
const formSchema = z.object({
  address: z.string().min(1, 'Indirizzo richiesto'),
  city: z.string().min(1, 'Città richiesta'),
  postalCode: z.string().regex(/^\d{4,10}$/, 'CAP non valido (4-10 cifre)'),
  province: z.string().regex(/^$|^[A-Za-z]{2}$/, '2 lettere o vuoto').optional().or(z.literal('')),
  latitude: z.number({ error: 'Latitudine non valida' }).min(-90).max(90),
  longitude: z.number({ error: 'Longitudine non valida' }).min(-180).max(180),
  notes: z.string().max(2000, 'Note troppo lunghe (max 2000 caratteri)').optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function IntermediaryLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Location | null>(null);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  /** Orari di apertura, gestiti fuori da RHF (controlled via MultiDayHoursEditor). */
  const [hours, setHours] = useState<LocationHours | null>(null);

  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: '',
      city: '',
      postalCode: '',
      province: '',
      latitude: 41.9028, // default Roma
      longitude: 12.4964,
      notes: '',
    },
  });

  const latId = useId();
  const lngId = useId();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/intermediary/locations');
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || 'Errore caricamento sedi');
      }
    } catch {
      toast.error('Errore di rete');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    methods.reset({
      address: '',
      city: '',
      postalCode: '',
      province: '',
      latitude: 41.9028,
      longitude: 12.4964,
      notes: '',
    });
    setHours(null);
    setEditing(null);
    setCreating(true);
  };

  const openEdit = (loc: Location) => {
    methods.reset({
      address: loc.address,
      city: loc.city,
      postalCode: loc.postalCode,
      province: loc.province || '',
      latitude: loc.latitude,
      longitude: loc.longitude,
      notes: loc.notes || '',
    });
    setHours(normalizeLocationHours(loc.hours));
    setEditing(loc);
    setCreating(true);
  };

  const closeModal = () => {
    setCreating(false);
    setEditing(null);
    setGeocodingError('');
    setLocationError('');
    setHours(null);
    methods.reset();
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      // Normalizza hours per il payload server: converti in shape v2 (array per giorno)
      const cleanedHours: LocationHours = {};
      for (const day of LOCATION_DAY_KEYS) {
        const slots = hours?.[day];
        if (slots && slots.length > 0) {
          cleanedHours[day] = slots;
        } else {
          cleanedHours[day] = null; // chiuso
        }
      }

      const payload = {
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        province: data.province || undefined,
        country: 'IT',
        latitude: data.latitude,
        longitude: data.longitude,
        hours: hours === null ? {} : cleanedHours,
        notes: data.notes || undefined,
      };

      const url = editing ? `/api/intermediary/locations/${editing.id}` : '/api/intermediary/locations';
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editing ? 'Sede aggiornata' : 'Sede creata');
        closeModal();
        fetchLocations();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || 'Errore durante il salvataggio');
      }
    } catch {
      toast.error('Errore di rete');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (loc: Location) => {
    if (!confirm(`Disattivare la sede "${loc.address}, ${loc.city}"? Le abilitazioni operatori restano attive.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/intermediary/locations/${loc.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Sede disattivata');
        fetchLocations();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || 'Errore durante la disattivazione');
      }
    } catch {
      toast.error('Errore di rete');
    }
  };

  const geocodeFromAddress = async () => {
    setGeocodingError('');
    setLocationError('');
    const address = methods.getValues('address');
    const city = methods.getValues('city');
    const postalCode = methods.getValues('postalCode');
    const province = methods.getValues('province');

    if (!address || !city) {
      setGeocodingError('Inserisci almeno indirizzo e città');
      return;
    }

    setGeocoding(true);
    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, city, cap: postalCode, province }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setGeocodingError(err?.error || 'Geocoding non disponibile');
        return;
      }
      const data = await res.json();
      if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
        setGeocodingError('Indirizzo non trovato');
        return;
      }
      methods.setValue('latitude', data.latitude, { shouldValidate: true, shouldDirty: true });
      methods.setValue('longitude', data.longitude, { shouldValidate: true, shouldDirty: true });
    } catch {
      setGeocodingError('Errore di rete durante il geocoding');
    } finally {
      setGeocoding(false);
    }
  };

  const useCurrentLocation = () => {
    setLocationError('');
    setGeocodingError('');

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocalizzazione non supportata dal browser');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        methods.setValue('latitude', position.coords.latitude, { shouldValidate: true, shouldDirty: true });
        methods.setValue('longitude', position.coords.longitude, { shouldValidate: true, shouldDirty: true });
        setLocating(false);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Permesso di geolocalizzazione negato');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Posizione non disponibile');
            break;
          case error.TIMEOUT:
            setLocationError('Timeout nella richiesta di posizione');
            break;
          default:
            setLocationError('Errore di geolocalizzazione');
        }
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 inline-flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary-600" aria-hidden="true" />
            Sedi
          </h1>
          <p className="text-gray-500 mt-1">
            {locations.length === 0
              ? 'Nessuna sede aggiuntiva configurata'
              : `${locations.filter((l) => l.isActive).length} attive · ${locations.length} totali`}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Le sedi aggiuntive sono punti di raccolta alternativi alla sede principale.
            I donatori potranno scegliere implicitamente consegnando presso una qualsiasi delle sedi dell&apos;ente.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}>
          Nuova sede
        </Button>
      </div>

      {locations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Nessuna sede aggiuntiva"
          description="Aggiungi punti di raccolta alternativi alla sede principale dell'ente."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className={`bg-white rounded-xl shadow-sm border p-5 ${
                loc.isActive ? '' : 'opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{loc.address}</h3>
                    {!loc.isActive && <Badge variant="default">Disattivata</Badge>}
                  </div>
                  <p className="text-sm text-gray-500">
                    {loc.postalCode} {loc.city} {loc.province && `(${loc.province})`}
                  </p>
                </div>
                <Badge variant="info">
                  {loc._count?.operatorLocations ?? 0} op.
                </Badge>
              </div>

              <div className="text-xs text-gray-500 mb-3">
                📍 {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
              </div>

              {loc.hours && Object.keys(loc.hours).length > 0 && (
                <div className="text-xs space-y-1 mb-3">
                  {LOCATION_DAY_KEYS.map((day) => {
                    const slots = loc.hours?.[day];
                    return (
                      <div key={day} className="flex items-center justify-between gap-2">
                        <span className="text-gray-600 shrink-0">{LOCATION_DAY_LABELS[day]}</span>
                        <span className="text-gray-900 text-right">
                          {slots && slots.length > 0
                            ? slots.map((s) => `${s.open}–${s.close}`).join(', ')
                            : <span className="text-gray-400">chiuso</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {loc.notes && (
                <p className="text-xs italic text-gray-600 mb-3 border-t pt-2">{loc.notes}</p>
              )}

              <div className="flex gap-2 pt-3 border-t">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openEdit(loc)}
                  leftIcon={<Pencil className="h-3.5 w-3.5" aria-hidden="true" />}
                  disabled={!loc.isActive}
                >
                  Modifica
                </Button>
                {loc.isActive && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDeactivate(loc)}
                    leftIcon={<Power className="h-3.5 w-3.5" aria-hidden="true" />}
                  >
                    Disattiva
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal create/edit */}
      <Modal
        isOpen={creating}
        onClose={closeModal}
        title={editing ? 'Modifica sede' : 'Nuova sede'}
        size="lg"
      >
        <FormProvider {...methods}>
          <Form methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Field name="address" label="Indirizzo" required placeholder="Via Roma 1" />
                <Field name="city" label="Città" required placeholder="Milano" />
                <Field name="postalCode" label="CAP" required placeholder="20100" />
                <Field name="province" label="Provincia (2 lettere)" placeholder="MI" />
              </div>

              {/* Coordinate + mappa */}
              <div className="grid md:grid-cols-2 gap-4">
                <Field
                  name="latitude"
                  label="Latitudine"
                  type="number"
                  step="any"
                  required
                  id={latId}
                />
                <Field
                  name="longitude"
                  label="Longitudine"
                  type="number"
                  step="any"
                  required
                  id={lngId}
                />
              </div>

              {/* Bottoni auto-fill coordinate */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={geocodeFromAddress}
                  disabled={geocoding || locating}
                  leftIcon={
                    geocoding ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    )
                  }
                >
                  {geocoding ? 'Calcolo...' : 'Calcola da indirizzo'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={useCurrentLocation}
                  disabled={geocoding || locating}
                  leftIcon={
                    locating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
                    )
                  }
                >
                  {locating ? 'Rilevamento...' : 'Usa posizione attuale'}
                </Button>
              </div>

              {/* Errori auto-fill */}
              {(geocodingError || locationError) && (
                <p className="text-sm text-red-600" role="alert">
                  {geocodingError || locationError}
                </p>
              )}

              {/* Coordinate correnti */}
              {(() => {
                const lat = methods.watch('latitude');
                const lng = methods.watch('longitude');
                if (typeof lat === 'number' && typeof lng === 'number') {
                  return (
                    <p className="text-xs text-gray-500">
                      Coordinate correnti: {lat.toFixed(4)}, {lng.toFixed(4)}
                    </p>
                  );
                }
                return null;
              })()}

              <div className="rounded-lg overflow-hidden border">
                <LocationMap
                  latitude={methods.watch('latitude') || 41.9028}
                  longitude={methods.watch('longitude') || 12.4964}
                  onLocationChange={(lat, lng) => {
                    methods.setValue('latitude', lat, { shouldValidate: true });
                    methods.setValue('longitude', lng, { shouldValidate: true });
                  }}
                  height="250px"
                  readonly={false}
                />
              </div>
              <p className="text-xs text-gray-500 -mt-2">
                Clicca sulla mappa per impostare le coordinate esatte. Le coordinate vengono compilate automaticamente.
              </p>

              {/* Orari */}
              <div>
                <MultiDayHoursEditor
                  value={hours}
                  onChange={setHours}
                />
              </div>

              {/* Note libere sede */}
              <div>
                <TextAreaField
                  name="notes"
                  label="Note sede"
                  placeholder="Es. Suonare il campanello, ingresso dal cortile..."
                  hint="Informazioni utili per chi deve raggiungere la sede."
                />
              </div>

              <ModalFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                >
                  {editing ? 'Salva modifiche' : 'Crea sede'}
                </Button>
              </ModalFooter>
            </div>
          </Form>
        </FormProvider>
      </Modal>
    </div>
  );
}
