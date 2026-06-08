'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { Home, MapPin, Loader2 } from 'lucide-react';
import CitySelector from '@/components/geo/CitySelector';
import {
  Button,
  Form, Field, useZodForm, toast,
} from '@/components/ui';
import { generateNickname, normalizeNickname } from '@/lib/nickname';

/**
 * Schema unico per create/edit di un beneficiario street.
 *
 * - firstName/lastName: required (validation server già li valida)
 * - nickname: max 30 char, normalizzato a [a-z0-9.]
 * - fiscalCode: max 16 char
 * - cap: max 5 char
 * - latitude/longitude/isee: number strings (parse lato server)
 *
 * - email: opzionale. Validato SOLO se valorizzato (regex + check placeholder
 *   KYKOS). L'API PATCH lato server applica gli stessi controlli + check
 *   unicità.
 * - needScore: opzionale. Stringa numerica 0-100. Solo admin (mostrato
 *   solo se `showNeedScore`).
 *
 * I campi email/needScore sono sempre nello schema (per evitare schema
 * dinamici), ma vengono renderizzati e inclusi nel body del submit SOLO
 * se le relative props sono attive.
 */
const beneficiarySchema = z
  .object({
    email: z.string().optional(),
    nickname: z.string().max(30, 'Massimo 30 caratteri').optional(),
    firstName: z.string().min(1, 'Il nome è obbligatorio'),
    lastName: z.string().min(1, 'Il cognome è obbligatorio'),
    fiscalCode: z.string().max(16, 'Massimo 16 caratteri').optional(),
    birthDate: z.string().optional(),
    address: z.string().optional(),
    houseNumber: z.string().optional(),
    cap: z.string().max(5, 'Massimo 5 caratteri').optional(),
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

type BeneficiaryFormValues = z.infer<typeof beneficiarySchema>;

const EMPTY_DEFAULTS: BeneficiaryFormValues = {
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

export interface BeneficiaryFormInitialData {
  email?: string | null;
  nickname?: string | null;
  firstName: string;
  lastName: string;
  fiscalCode?: string | null;
  birthDate?: string | null;
  address?: string | null;
  houseNumber?: string | null;
  cap?: string | null;
  city?: string | null;
  province?: string | null;
  isee?: string | null;
  needScore?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface BeneficiaryFormProps {
  mode: 'create' | 'edit';
  /** Richiesto in mode='edit'. */
  beneficiaryId?: string;
  /** Valori iniziali (per edit mode). */
  initialData?: BeneficiaryFormInitialData;
  /** Mostra campo Email con validazione (per edit mode). Default: false. */
  showEmail?: boolean;
  /** Mostra campo Score di bisogno 0-100 (admin-only). Default: false. */
  showNeedScore?: boolean;
  onSuccess: (data: { id?: string }) => void;
  onCancel: () => void;
}

/**
 * <BeneficiaryForm> — form riusabile per creazione/modifica di un
 * beneficiario street-managed. Self-contained: gestisce submit, geocoding,
 * generazione nickname, validazione zod.
 *
 * Props opzionali per differenziare create vs edit:
 * - `showEmail`: aggiunge campo Email (con regex + check placeholder)
 * - `showNeedScore`: aggiunge campo Score di bisogno 0-100 (admin-only)
 *
 * In `mode='create'` i campi email/needScore sono MAI inclusi nel body
 * (l'API POST li genera/gestisce diversamente). In `mode='edit'` sono
 * inclusi SOLO se le relative props sono attive.
 *
 * Esempio create:
 *   <BeneficiaryForm
 *     mode="create"
 *     onSuccess={() => router.refresh()}
 *     onCancel={() => setShowForm(false)}
 *   />
 *
 * Esempio edit (con email + needScore):
 *   <BeneficiaryForm
 *     mode="edit"
 *     beneficiaryId={id}
 *     showEmail
 *     showNeedScore
 *     initialData={beneficiary}
 *     onSuccess={() => router.push(detail)}
 *     onCancel={() => router.back()}
 *   />
 */
export function BeneficiaryForm({
  mode,
  beneficiaryId,
  initialData,
  showEmail = false,
  showNeedScore = false,
  onSuccess,
  onCancel,
}: BeneficiaryFormProps) {
  // Local state per azioni isolate (geocoding, genera nickname)
  const [geocoding, setGeocoding] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [generatingNickname, setGeneratingNickname] = useState(false);

  const methods = useZodForm(beneficiarySchema, { defaultValues: EMPTY_DEFAULTS });
  const { setValue, reset, watch, handleSubmit, formState } = methods;

  const address = watch('address');
  const city = watch('city');
  const latitude = watch('latitude');
  const longitude = watch('longitude');

  // Inizializza form con initialData in modalità edit
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        email: (initialData.email && showEmail) ? initialData.email : '',
        nickname: initialData.nickname || '',
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        fiscalCode: (initialData.fiscalCode || '').toUpperCase(),
        birthDate: initialData.birthDate
          ? new Date(initialData.birthDate).toISOString().split('T')[0]
          : '',
        address: initialData.address || '',
        houseNumber: initialData.houseNumber || '',
        cap: initialData.cap || '',
        city: initialData.city || '',
        province: initialData.province || '',
        isee: initialData.isee || '',
        needScore: (initialData.needScore != null && showNeedScore) ? initialData.needScore.toString() : '',
        latitude: initialData.latitude?.toString() || '',
        longitude: initialData.longitude?.toString() || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, beneficiaryId]);

  const onSubmit = async (data: BeneficiaryFormValues) => {
    const isEdit = mode === 'edit' && beneficiaryId;
    const url = isEdit
      ? `/api/operator/street-beneficiaries/${beneficiaryId}`
      : '/api/operator/street-beneficiaries';
    const method = isEdit ? 'PATCH' : 'POST';

    // Body base — presente in create e edit
    const body: Record<string, unknown> = {
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
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    };

    // Email e needScore SOLO in modalità edit (con prop attiva)
    if (isEdit && showEmail) {
      body.email = data.email || null;
    }
    if (isEdit && showNeedScore) {
      body.needScore = data.needScore ? parseInt(data.needScore, 10) : null;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || (isEdit ? 'Errore durante il salvataggio' : 'Errore nella creazione'));
        return;
      }

      toast.success(isEdit ? 'Modifiche salvate' : 'Beneficiario creato');

      // Estrai id dal body della response (POST e PATCH ritornano { beneficiary })
      let id: string | undefined;
      try {
        const json = await res.json();
        id = json?.beneficiary?.id;
      } catch {
        // response senza body JSON — ok
      }
      onSuccess({ id });
    } catch {
      toast.error('Errore di connessione');
    }
  };

  const handleGenerateNickname = () => {
    setGeneratingNickname(true);
    setValue('nickname', generateNickname(), { shouldValidate: true });
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

  return (
    <Form methods={methods} onSubmit={handleSubmit(onSubmit)}>
      {/* Email — solo se showEmail (edit mode con prop attiva) */}
      {showEmail && (
        <div className="mb-4">
          <Field
            name="email"
            label="Email"
            type="email"
            hint="Necessaria per creare l'account. Non usare email placeholder."
          />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Field
          name="firstName"
          label="Nome"
          required
          placeholder="Mario"
        />
        <Field
          name="lastName"
          label="Cognome"
          required
          placeholder="Rossi"
        />

        {/* Nickname con bottone "Genera" */}
        <div className="md:col-span-2 space-y-1">
          <label htmlFor="nickname-input" className="block text-sm font-medium text-gray-700">
            Nickname
          </label>
          <div className="flex gap-2">
            <input
              id="nickname-input"
              {...methods.register('nickname')}
              placeholder="segreto.vento.42"
              maxLength={30}
              className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              onChange={(e) =>
                setValue('nickname', normalizeNickname(e.target.value), { shouldValidate: true })
              }
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleGenerateNickname}
              disabled={generatingNickname}
            >
              {generatingNickname ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Genera'}
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            Usato dagli enti per identificare il beneficiario
          </p>
          {methods.formState.errors.nickname && (
            <p className="text-xs text-error-600">
              {methods.formState.errors.nickname.message}
            </p>
          )}
        </div>

        <Field
          name="fiscalCode"
          label="Codice Fiscale"
          placeholder="RSSMRA85T10A562U"
          maxLength={16}
          onChange={(e) =>
            setValue('fiscalCode', e.target.value.toUpperCase(), { shouldValidate: true })
          }
        />
        <Field
          name="birthDate"
          label="Data di nascita"
          type="date"
        />
        <div className="md:col-span-2">
          <Field
            name="address"
            label="Indirizzo"
            placeholder="Via Roma, 123"
          />
        </div>
        <Field
          name="houseNumber"
          label="Numero civico"
        />
        <Field
          name="cap"
          label="CAP"
          maxLength={5}
        />
        <div className="md:col-span-2 space-y-1">
          <span id="city-section-label" className="block text-sm font-medium text-gray-700">
            Città e Provincia
          </span>
          <div aria-labelledby="city-section-label">
          <CitySelector
            selectedProvince={watch('province') || ''}
            selectedCity={watch('city') || ''}
            onProvinceChange={(sigla) => setValue('province', sigla, { shouldValidate: false })}
            onCityChange={(name) => setValue('city', name, { shouldValidate: false })}
          />
          </div>
        </div>
        <Field
          name="isee"
          label="ISEE (€)"
          type="number"
          step="0.01"
          placeholder="0.00"
        />
        {showNeedScore && (
          <Field
            name="needScore"
            label="Score di bisogno (0-100)"
            type="number"
            min={0}
            max={100}
            placeholder="0-100"
          />
        )}
      </div>

      {/* Geolocation */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mt-4">
        <h3 className="font-medium text-gray-900 flex items-center gap-2 text-sm mb-2">
          <MapPin className="h-4 w-4" /> Geolocalizzazione
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          {latitude && longitude
            ? `Posizione: ${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}`
            : 'Non rilevata'}
        </p>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleGeocode}
          disabled={geocoding || !address || !city}
        >
          {geocoding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Calcolo...
            </>
          ) : (
            <>
              <Home className="h-4 w-4 mr-2" /> Calcola da indirizzo
            </>
          )}
        </Button>
        {locationError && (
          <p className="text-xs text-error-600 mt-2">{locationError}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={formState.isSubmitting}
        >
          Annulla
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={formState.isSubmitting}
        >
          {mode === 'edit' ? 'Salva modifiche' : 'Crea beneficiario'}
        </Button>
      </div>
    </Form>
  );
}
