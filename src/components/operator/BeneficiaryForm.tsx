'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { Home, MapPin, Loader2 } from 'lucide-react';
import CitySelector from '@/components/geo/CitySelector';
import {
  Button, Input,
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
 * NON include email: in create è generato server-side, in edit l'edit page
 * lo gestisce separatamente (vedi [[street-beneficiaries]]/[id]/edit).
 * NON include needScore: campo admin-only.
 */
const beneficiarySchema = z.object({
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
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type BeneficiaryFormValues = z.infer<typeof beneficiarySchema>;

const EMPTY_DEFAULTS: BeneficiaryFormValues = {
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
  latitude: '',
  longitude: '',
};

export interface BeneficiaryFormInitialData {
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
  latitude?: number | null;
  longitude?: number | null;
}

export interface BeneficiaryFormProps {
  mode: 'create' | 'edit';
  /** Richiesto in mode='edit'. */
  beneficiaryId?: string;
  /** Valori iniziali (per edit mode). */
  initialData?: BeneficiaryFormInitialData;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * <BeneficiaryForm> — form riusabile per creazione/modifica di un
 * beneficiario street-managed. Self-contained: gestisce submit, geocoding,
 * generazione nickname, validazione zod.
 *
 * Pattern uniformato con [[street-beneficiaries]]/[id]/edit (Fase 6.1).
 *
 * Esempio:
 *   <BeneficiaryForm
 *     mode="create"
 *     onSuccess={() => router.refresh()}
 *     onCancel={() => setShowForm(false)}
 *   />
 */
export function BeneficiaryForm({
  mode,
  beneficiaryId,
  initialData,
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

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || (isEdit ? 'Errore durante il salvataggio' : 'Errore nella creazione'));
        return;
      }

      toast.success(isEdit ? 'Modifiche salvate' : 'Beneficiario creato');
      onSuccess();
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
          <label className="block text-sm font-medium text-gray-700">
            Nickname
          </label>
          <div className="flex gap-2">
            <input
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
          <label className="block text-sm font-medium text-gray-700">
            Città e Provincia
          </label>
          <CitySelector
            selectedProvince={watch('province') || ''}
            selectedCity={watch('city') || ''}
            onProvinceChange={(sigla) => setValue('province', sigla, { shouldValidate: false })}
            onCityChange={(name) => setValue('city', name, { shouldValidate: false })}
          />
        </div>
        <Field
          name="isee"
          label="ISEE (€)"
          type="number"
          step="0.01"
          placeholder="0.00"
        />
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
