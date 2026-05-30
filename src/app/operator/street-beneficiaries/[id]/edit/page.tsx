'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CitySelector from '@/components/geo/CitySelector';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge, Alert, Spinner } from '@/components/ui';

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
  referenceEntity?: {
    id: string;
    name: string;
    city: string | null;
  };
}

interface FormData {
  email: string;
  nickname: string;
  firstName: string;
  lastName: string;
  fiscalCode: string;
  birthDate: string;
  address: string;
  houseNumber: string;
  cap: string;
  city: string;
  province: string;
  isee: string;
  latitude: string;
  longitude: string;
}

export default function EditStreetBeneficiaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [beneficiary, setBeneficiary] = useState<StreetBeneficiary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [generatingNickname, setGeneratingNickname] = useState(false);

  const [formData, setFormData] = useState<FormData>({
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
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    fetchBeneficiary();
  }, [id]);

  const fetchBeneficiary = async () => {
    try {
      const res = await fetch(`/api/operator/street-beneficiaries/${id}`);
      if (!res.ok) throw new Error('Beneficiario non trovato');
      const data = await res.json();
      const b = data.beneficiary;
      setBeneficiary(b);

      setFormData({
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
        latitude: b.latitude?.toString() || '',
        longitude: b.longitude?.toString() || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) return;

    // Validate email if provided
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Formato email non valido');
        return;
      }
      // Check for placeholder emails
      if (formData.email.includes('@street.kykos.local') ||
          formData.email.includes('@placeholder') ||
          formData.email.startsWith('street.')) {
        setError('Email non valida. Inserisci una email reale della persona.');
        return;
      }
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/operator/street-beneficiaries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email || null,
          nickname: formData.nickname || null,
          firstName: formData.firstName,
          lastName: formData.lastName,
          fiscalCode: formData.fiscalCode || null,
          birthDate: formData.birthDate || null,
          address: formData.address || null,
          houseNumber: formData.houseNumber || null,
          cap: formData.cap || null,
          city: formData.city || null,
          province: formData.province || null,
          isee: formData.isee || null,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        fetchBeneficiary();
      } else {
        const data = await res.json();
        setError(data.error || 'Errore durante il salvataggio');
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setSaving(false);
    }
  };

  const geocodeFromAddress = async () => {
    if (!formData.address || !formData.city) {
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
          address: formData.address,
          city: formData.city,
          cap: formData.cap,
          province: formData.province,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLocationError(data.error || 'Errore nel calcolo della posizione');
        return;
      }
      setFormData(prev => ({
        ...prev,
        latitude: data.latitude.toString(),
        longitude: data.longitude.toString(),
      }));
    } catch {
      setLocationError('Errore di connessione');
    } finally {
      setGeocoding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!beneficiary) {
    return (
      <Alert type="error" title="Errore">
        {error || 'Beneficiario non trovato'}
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
          <Link href={`/operator/street-beneficiaries/${id}`} className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-flex items-center gap-1">
            ← Dettaglio beneficiario
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Modifica: {beneficiary.firstName} {beneficiary.lastName}
          </h1>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert type="error" title="Errore">
          {error}
        </Alert>
      )}
      {success && (
        <Alert type="success" title="Salvato">
          Modifiche salvate con successo
        </Alert>
      )}

      {/* Account Status */}
      {beneficiary.authUserId || beneficiary.emailConfirmed ? (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Badge variant="success">Account attivo</Badge>
              <span className="text-sm text-gray-600">
                {beneficiary.email}
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Badge variant="warning">Senza account</Badge>
              {!formData.email && (
                <span className="text-sm text-amber-700">
                  Per creare un account, inserisci l'email della persona qui sotto
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Dati anagrafici</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="email@esempio.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Necessaria per creare l'account. Non usare email placeholder.
              </p>
            </div>

            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Cognome *
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            </div>

            {/* Nickname */}
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                Nickname
              </label>
              <div className="flex gap-2">
                <input
                  id="nickname"
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, '') }))}
                  maxLength={30}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="aggettivo.nome.123"
                />
                <button
                  type="button"
                  onClick={async () => {
                    setGeneratingNickname(true);
                    try {
                      const adjectives = ['buono', 'gentile', 'caldo', 'luminoso', 'mite', 'sereno', 'solare', 'felice', 'saggio', 'ardito'];
                      const nouns = ['cuore', 'anima', 'spirito', 'sogno', 'sole', 'stella', 'luna', 'fiore', 'albero', 'vento'];
                      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
                      const noun = nouns[Math.floor(Math.random() * nouns.length)];
                      const num = Math.floor(Math.random() * 999) + 1;
                      setFormData(prev => ({ ...prev, nickname: `${adj}.${noun}.${num}` }));
                    } finally {
                      setGeneratingNickname(false);
                    }
                  }}
                  disabled={generatingNickname}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  {generatingNickname ? '...' : 'Genera'}
                </button>
              </div>
            </div>

            {/* Birth Date & Fiscal Code */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Data di nascita
                </label>
                <input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="fiscalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Codice Fiscale
                </label>
                <input
                  id="fiscalCode"
                  type="text"
                  value={formData.fiscalCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, fiscalCode: e.target.value.toUpperCase() }))}
                  maxLength={16}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none uppercase"
                />
              </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Indirizzo
                </label>
                <input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="houseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  N.
                </label>
                <input
                  id="houseNumber"
                  type="text"
                  value={formData.houseNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, houseNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            </div>

            {/* City Selector */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="cap" className="block text-sm font-medium text-gray-700 mb-1">
                  CAP
                </label>
                <input
                  id="cap"
                  type="text"
                  value={formData.cap}
                  onChange={(e) => setFormData(prev => ({ ...prev, cap: e.target.value }))}
                  maxLength={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  Città
                </label>
                <CitySelector
                  selectedProvince={formData.province}
                  selectedCity={formData.city}
                  onProvinceChange={(val) => setFormData(prev => ({ ...prev, province: val }))}
                  onCityChange={(name) => setFormData(prev => ({ ...prev, city: name }))}
                />
              </div>
            </div>

            {/* ISEE */}
            <div>
              <label htmlFor="isee" className="block text-sm font-medium text-gray-700 mb-1">
                ISEE
              </label>
              <input
                id="isee"
                type="number"
                step="0.01"
                value={formData.isee}
                onChange={(e) => setFormData(prev => ({ ...prev, isee: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="0.00"
              />
            </div>

            {/* Geolocation */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Geolocalizzazione</label>
                {formData.latitude && formData.longitude && (
                  <span className="text-xs text-green-600">
                    ✓ {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={geocodeFromAddress}
                  disabled={geocoding || !formData.address || !formData.city}
                  className="px-3 py-2 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {geocoding ? '⏳ Calcolo...' : '🏠 Calcola da indirizzo'}
                </button>
                {(formData.latitude || formData.longitude) && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, latitude: '', longitude: '' }))}
                    className="px-3 py-2 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-300"
                  >
                    🗑️ Clear
                  </button>
                )}
              </div>
              {locationError && (
                <p className="text-xs text-red-600 mt-2">{locationError}</p>
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
              <Button
                type="submit"
                variant="primary"
                loading={saving}
              >
                Salva modifiche
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}