'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Home, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import CitySelector from '@/components/geo/CitySelector';
import {
  Button, Input, Card, CardHeader, CardTitle, CardContent, Badge, Alert,
  Form, Field, useZodForm, toast, Skeleton, SkeletonCard, SkeletonText,
} from '@/components/ui';
import { generateNickname, normalizeNickname } from '@/lib/nickname';

interface StreetBeneficiary {
  id: string;
  email: string | null;
  nickname: string | null;
  firstName: string;
  lastName: string;
  fiscalCode: string | null;
  birthDate: string | null;
  address: string | null;
  houseNumber: string | null;
  cap: string | null;
  city: string | null;
  province: string | null;
  isee: string | null;
  latitude: number | null;
  longitude: number | null;
  isStreetManaged: boolean;
  createdAt: string;
  authUserId: string | null;
  emailConfirmed: boolean;
  needScore: number | null;
  referenceEntity?: {
    id: string;
    name: string;
    city: string | null;
  };
}

// Schema sovrapposto al client esistente: solo le regole già applicate
// (required su nome/cognome, regex email + check placeholder, max 30 char su nickname,
// max 16 char su CF, max 5 char su CAP). Niente regole nuove — decisione utente 2026-06-04.
const editSchema = z
  .object({
    email: z.string().optional(),
    nickname: z.string().max(30).optional(),
    firstName: z.string().min(1, 'Il nome è obbligatorio'),
    lastName: z.string().min(1, 'Il cognome è obbligatorio'),
    fiscalCode: z.string().max(16).optional(),
    birthDate: z.string().optional(),
    address: z.string().optional(),
    houseNumber: z.string().optional(),
    cap: z.string().max(5).optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    isee: z.string().optional(),
    needScore: z.string().optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.email && data.email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['email'],
          message: 'Formato email non valido',
        });
      }
      if (
        data.email.includes('@street.kykos.local') ||
        data.email.includes('@placeholder') ||
        data.email.startsWith('street.')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['email'],
          message: 'Email non valida. Inserisci una email reale della persona.',
        });
      }
    }
  });

type EditFormValues = z.infer<typeof editSchema>;

const EMPTY_DEFAULTS: EditFormValues = {
  email: '',
  nickname: '',
  firstName: '',
  lastName: '',
  fiscalCode: '',
  birthDate: '',
  address: '',
  houseNumber: '',
  cap: '',
  city: '',
  province: '',
  isee: '',
  needScore: '',
  latitude: '',
  longitude: '',
};

function beneficiaryToFormValues(b: StreetBeneficiary): EditFormValues {
  return {
    email: b.email || '',
    nickname: b.nickname || '',
    firstName: b.firstName,
    lastName: b.lastName,
    fiscalCode: (b.fiscalCode || '').toUpperCase(),
    birthDate: b.birthDate ? new Date(b.birthDate).toISOString().split('T')[0] : '',
    address: b.address || '',
    houseNumber: b.houseNumber || '',
    cap: b.cap || '',
    city: b.city || '',
    province: b.province || '',
    isee: b.isee || '',
    needScore: b.needScore?.toString() || '',
    latitude: b.latitude?.toString() || '',
    longitude: b.longitude?.toString() || '',
  };
}

export default function EditStreetBeneficiaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [beneficiary, setBeneficiary] = useState<StreetBeneficiary | null>(null);
  const [loading, setLoading] = useState(true);
  // useState locali per azioni isolate (geocoding), fuori dal form principale
  const [geocoding, setGeocoding] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [generatingNickname, setGeneratingNickname] = useState(false);

  const methods = useZodForm(editSchema, { defaultValues: EMPTY_DEFAULTS });
  const { register, reset, setValue, watch, handleSubmit, formState } = methods;

  // Osserva i campi usati per abilitare/disabilitare i bottoni dipendenti
  const address = watch('address');
  const city = watch('city');
  const latitude = watch('latitude');
  const longitude = watch('longitude');
  const formEmail = watch('email');

  useEffect(() => {
    fetchBeneficiary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBeneficiary = async () => {
    try {
      const res = await fetch(`/api/operator/street-beneficiaries/${id}`);
      if (!res.ok) throw new Error('Beneficiario non trovato');
      const data = await res.json();
      const b = data.beneficiary as StreetBeneficiary;
      setBeneficiary(b);
      reset(beneficiaryToFormValues(b));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EditFormValues) => {
    try {
      const res = await fetch(`/api/operator/street-beneficiaries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email || null,
          nickname: data.nickname || null,
          firstName: data.firstName,
          lastName: data.lastName,
          fiscalCode: data.fiscalCode || null,
          birthDate: data.birthDate || null,
          address: data.address || null,
          houseNumber: data.houseNumber || null,
          cap: data.cap || null,
          city: data.city || null,
          province: data.province || null,
          isee: data.isee || null,
          needScore: data.needScore ? parseInt(data.needScore) : null,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Errore durante il salvataggio');
        return;
      }

      toast.success('Modifiche salvate');
      // Aggiorna lo state locale con i valori appena salvati (per coerenza
      // con la logica originale che rifaceva la fetch)
      const updated = await res.json();
      if (updated.beneficiary) {
        setBeneficiary(updated.beneficiary);
      } else {
        fetchBeneficiary();
      }
    } catch {
      toast.error('Errore di connessione');
    }
  };

  const handleGenerateNickname = () => {
    setGeneratingNickname(true);
    setValue('nickname', generateNickname(), { shouldValidate: true });
    // Piccolo delay per feedback visivo del loading state
    setTimeout(() => setGeneratingNickname(false), 200);
  };

  const handleGeocode = async () => {
    if (!address || !city) {
      setLocationError('Inserisci prima indirizzo e città');
      return;
    }
    setGeocoding(true);
    setLocationError('');
    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          city,
          cap: watch('cap'),
          province: watch('province'),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLocationError(data.error || 'Errore nel calcolo della posizione');
        return;
      }
      setValue('latitude', data.latitude.toString(), { shouldValidate: false });
      setValue('longitude', data.longitude.toString(), { shouldValidate: false });
    } catch {
      setLocationError('Errore di connessione');
    } finally {
      setGeocoding(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <SkeletonCard />
        <SkeletonText lines={5} />
      </div>
    );
  }

  if (!beneficiary) {
    return (
      <Alert type="error" title="Errore" icon={<AlertCircle />}>
        Beneficiario non trovato
        <div className="mt-4">
          <Link href="/operator/street-beneficiaries">
            <Button variant="secondary">Torna ai beneficiari</Button>
          </Link>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/operator/street-beneficiaries/${id}`}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-flex items-center gap-1"
          >
            ← Dettaglio beneficiario
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Modifica: {beneficiary.firstName} {beneficiary.lastName}
          </h1>
        </div>
      </div>

      {/* Account Status */}
      {beneficiary.authUserId || beneficiary.emailConfirmed ? (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Badge variant="success">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Account attivo
              </Badge>
              <span className="text-sm text-gray-600">{beneficiary.email}</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert type="warning" title="Senza account" icon={<AlertCircle />}>
          {!formEmail && 'Per creare un account, inserisci l\'email della persona qui sotto'}
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Dati anagrafici</CardTitle>
        </CardHeader>
        <CardContent>
          <Form methods={methods} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email — Field con zod (errore inline) */}
            <Field
              name="email"
              label="Email"
              type="email"
              hint="Necessaria per creare l'account. Non usare email placeholder."
            />

            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <Field name="firstName" label="Nome" required />
              <Field name="lastName" label="Cognome" required />
            </div>

            {/* Nickname — Input (no zod) con normalizzazione onChange */}
            <div>
              <Input
                label="Nickname"
                type="text"
                maxLength={30}
                placeholder="aggettivo.nome.123"
                {...register('nickname', {
                  setValueAs: (v: string) => normalizeNickname(v),
                })}
                onChange={(e) =>
                  setValue('nickname', normalizeNickname(e.target.value), { shouldValidate: true })
                }
              />
              <div className="mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={generatingNickname}
                  onClick={handleGenerateNickname}
                >
                  Genera
                </Button>
              </div>
            </div>

            {/* Birth Date & Fiscal Code */}
            <div className="grid grid-cols-2 gap-4">
              <Input label="Data di nascita" type="date" {...register('birthDate')} />
              <Input
                label="Codice Fiscale"
                type="text"
                maxLength={16}
                className="uppercase"
                {...register('fiscalCode', {
                  setValueAs: (v: string) => v.toUpperCase(),
                })}
                onChange={(e) =>
                  setValue('fiscalCode', e.target.value.toUpperCase(), { shouldValidate: true })
                }
              />
            </div>

            {/* Address */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Input label="Indirizzo" type="text" {...register('address')} />
              </div>
              <Input label="N." type="text" {...register('houseNumber')} />
            </div>

            {/* City Selector (custom component) */}
            <div className="grid grid-cols-3 gap-4">
              <Input label="CAP" type="text" maxLength={5} {...register('cap')} />
              <div className="col-span-2">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  Città
                </label>
                <CitySelector
                  selectedProvince={watch('province') ?? ''}
                  selectedCity={watch('city') ?? ''}
                  onProvinceChange={(val) => setValue('province', val, { shouldValidate: false })}
                  onCityChange={(name) => setValue('city', name, { shouldValidate: false })}
                />
              </div>
            </div>

            {/* ISEE */}
            <Input
              label="ISEE"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('isee')}
            />

            {/* Need Score */}
            <Input
              label="Score di bisogno (0-100)"
              type="number"
              min={0}
              max={100}
              placeholder="0-100"
              {...register('needScore')}
            />

            {/* Geolocation */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Geolocalizzazione</label>
                {latitude && longitude && (
                  <Badge variant="success">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Posizione: {parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={geocoding}
                  disabled={!address || !city}
                  leftIcon={<Home className="h-4 w-4" />}
                  onClick={handleGeocode}
                >
                  Calcola da indirizzo
                </Button>
                {(latitude || longitude) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => {
                      setValue('latitude', '', { shouldValidate: false });
                      setValue('longitude', '', { shouldValidate: false });
                    }}
                  >
                    Pulisci
                  </Button>
                )}
              </div>
              {locationError && (
                <p className="text-xs text-error-600 mt-2">{locationError}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push(`/operator/street-beneficiaries/${id}`)}
              >
                Annulla
              </Button>
              <Button type="submit" variant="primary" loading={formState.isSubmitting}>
                Salva modifiche
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
