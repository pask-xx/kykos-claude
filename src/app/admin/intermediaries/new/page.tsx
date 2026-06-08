'use client';

import { useState, useEffect, Suspense, useId } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertTriangle, MapPin, Check, Loader2 } from 'lucide-react';
import CitySelector from '@/components/geo/CitySelector';

interface Diocese {
  id: string;
  name: string;
  seat: string;
  distance: number;
}

function NewIntermediaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ tempPassword?: string; emailSent?: boolean } | null>(null);

  // Check if came from adesione approval
  const fromAdesione = searchParams.get('from') === 'adesione';
  const enteId = searchParams.get('enteId');

  // User fields
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const orgNameId = useId();
  const orgTypeId = useId();
  const phoneId = useId();
  const addressId = useId();
  const capId = useId();
  const dioceseSelectId = useId();

  // Organization fields
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('CHARITY');
  const [address, setAddress] = useState('');
  const [cap, setCap] = useState('');
  const [phone, setPhone] = useState('');

  // City fields (from CitySelector)
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [cityCoords, setCityCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });

  // Diocese fields
  const [dioceses, setDioceses] = useState<Diocese[]>([]);
  const [dioceseId, setDioceseId] = useState('');

  // Geocoding
  const [geocoding, setGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState('');

  // Pre-fill from adesione if available
  useEffect(() => {
    if (fromAdesione && enteId) {
      fetch(`/api/adesione/${enteId}`)
        .then(res => res.json())
        .then(data => {
          if (data.adesione) {
            setOrgName(data.adesione.denominazione || '');
            setEmail(data.adesione.email || '');
            setFirstName(data.adesione.nomeReferente || '');
            setLastName(data.adesione.cognomeReferente || '');
            setAddress(data.adesione.indirizzo || '');
            setCap(data.adesione.cap || '');
            setCity(data.adesione.citta || '');
            setProvince(data.adesione.provincia || '');
            setPhone(data.adesione.telefono || '');
            if (data.adesione.website) {
              // Could set additional fields if needed
            }
          }
        })
        .catch(console.error);
    }
  }, [fromAdesione, enteId]);

  // Fetch dioceses when coordinates are available
  useEffect(() => {
    if (cityCoords.lat && cityCoords.lng) {
      fetchDioceses();
    }
  }, [cityCoords.lat, cityCoords.lng]);

  const fetchDioceses = async () => {
    if (!cityCoords.lat || !cityCoords.lng) return;
    try {
      const res = await fetch(`/api/dioceses?lat=${cityCoords.lat}&lng=${cityCoords.lng}&radius=50`);
      const data = await res.json();
      setDioceses(data.dioceses || []);
    } catch (err) {
      console.error('Error fetching dioceses:', err);
    }
  };

  const geocodeFromAddress = async () => {
    if (!address || !city) {
      setGeocodingError('Inserisci indirizzo e città');
      return;
    }

    setGeocoding(true);
    setGeocodingError('');

    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, city, cap, province }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGeocodingError(data.error || 'Errore nel calcolo delle coordinate');
        return;
      }

      setCityCoords({ lat: data.latitude, lng: data.longitude });
    } catch {
      setGeocodingError('Errore di connessione');
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    if (!firstName || !lastName || !email || !orgName) {
      setError('Tutti i campi sono obbligatori');
      return;
    }

    // If user provided address but didn't geocode, try to geocode now
    if (address && (!cityCoords.lat || !cityCoords.lng)) {
      await geocodeFromAddress();
    }

    // If still no coords, use city coords as fallback (from CitySelector)
    const finalLat = cityCoords.lat;
    const finalLng = cityCoords.lng;

    if (!finalLat || !finalLng) {
      setError('Coordinate non disponibili. Compila indirizzo e città correttamente.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/intermediaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          orgName,
          orgType,
          address,
          cap,
          province,
          city,
          phone,
          latitude: finalLat,
          longitude: finalLng,
          dioceseId: dioceseId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore durante la creazione');
        return;
      }

      setSuccess({
        tempPassword: data.tempPassword,
        emailSent: data.emailSent,
      });
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl">
        <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-success-600" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ente creato!</h2>
          <p className="text-gray-600 mb-6">
            L&apos;ente <strong>{orgName}</strong> è stato creato con successo.
          </p>

          {!success.emailSent && success.tempPassword && (
            <div className="bg-warning-50 border border-warning-200 rounded-xl p-6 mb-6 text-left">
              <p className="font-medium text-warning-800 mb-2 inline-flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                L&apos;email non è stata inviata
              </p>
              <p className="text-sm text-warning-700 mb-4">
                Comunica manualmente queste credenziali all&apos;amministratore dell&apos;ente:
              </p>
              <div className="bg-white rounded-lg p-4 space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-mono font-medium">{email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Password temporanea</p>
                  <p className="font-mono font-medium text-lg">{success.tempPassword}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <Link
              href="/admin/dashboard"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition"
            >
              Torna alla dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/dashboard" className="hover:text-primary-600">
          Enti
        </Link>
        <span>→</span>
        <span>Nuovo Ente</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Crea nuovo Ente</h1>

      {error && (
        <div className="mb-6 p-4 bg-error-50 border border-error-200 text-error-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Admin User Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Amministratore</h2>
          <p className="text-sm text-gray-500 mb-4">
            L&apos;account che userai per gestire l&apos;ente su KYKOS. Riceverai un&apos;email con la password temporanea.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={firstNameId} className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                id={firstNameId}
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="Mario"
              />
            </div>
            <div>
              <label htmlFor={lastNameId} className="block text-sm font-medium text-gray-700 mb-1">Cognome *</label>
              <input
                id={lastNameId}
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="Rossi"
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor={emailId} className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              id={emailId}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder="admin@caritas.it"
            />
          </div>
        </div>

        {/* Organization Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informazioni Ente</h2>

          <div>
            <label htmlFor={orgNameId} className="block text-sm font-medium text-gray-700 mb-1">Nome Ente *</label>
            <input
              id={orgNameId}
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder="Caritas Diocesana Roma"
            />
          </div>

          <div className="mt-4">
            <label htmlFor={orgTypeId} className="block text-sm font-medium text-gray-700 mb-1">Tipo Ente *</label>
            <select
              id={orgTypeId}
              value={orgType}
              onChange={(e) => setOrgType(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
            >
              <option value="CHARITY">Centro Caritas</option>
              <option value="CHURCH">Parrocchia</option>
              <option value="ASSOCIATION">Associazione</option>
            </select>
          </div>

          <div className="mt-4">
            <label htmlFor={phoneId} className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
            <input
              id={phoneId}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder="+39 06 1234567"
            />
          </div>

          <div className="mt-4">
            <label htmlFor={addressId} className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
            <input
              id={addressId}
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder="Via del Corso"
            />
          </div>

          <div className="mt-4">
            <label htmlFor={capId} className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
            <input
              id={capId}
              type="text"
              value={cap}
              onChange={(e) => setCap(e.target.value)}
              maxLength={5}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder="00100"
            />
          </div>

          <div className="mt-4">
            <CitySelector
              selectedProvince={province}
              selectedCity={city}
              onProvinceChange={setProvince}
              onCityChange={(name, lat, lng) => {
                setCity(name);
                setCityCoords({ lat: lat ?? null, lng: lng ?? null });
              }}
            />
          </div>

          {/* Diocese Selection */}
          <div className="mt-4">
            <label htmlFor={dioceseSelectId} className="block text-sm font-medium text-gray-700 mb-1">Diocesi di appartenenza</label>
            {!cityCoords.lat || !cityCoords.lng ? (
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 text-sm">
                Calcola prima le coordinate per vedere le diocesi vicine
              </div>
            ) : (
              <select
                id={dioceseSelectId}
                value={dioceseId}
                onChange={(e) => setDioceseId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              >
                <option value="">Seleziona diocesi ({dioceses.length} trovate)</option>
                {dioceses.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} - {d.seat} ({d.distance.toFixed(1)} km)
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Facoltativo. Aiuta a identificare l&apos;ente nella propria diocesi.
            </p>
          </div>

          {/* Geocoding Section */}
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="font-medium text-gray-900 flex items-center gap-2 text-sm mb-2">
              <MapPin className="w-4 h-4 text-gray-500" aria-hidden="true" /> Coordinate geografiche
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              {cityCoords.lat && cityCoords.lng
                ? `Coordinate: ${cityCoords.lat.toFixed(6)}, ${cityCoords.lng.toFixed(6)}`
                : 'Non ancora calcolate'}
              {cityCoords.lat && cityCoords.lng && city && (
                <span className="text-success-600 ml-2 inline-flex items-center gap-0.5">
                  <Check className="w-3 h-3" aria-hidden="true" /> dal comune
                </span>
              )}
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={geocodeFromAddress}
                disabled={geocoding || !address || !city}
                className="flex-1 px-3 py-2 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition flex items-center justify-center gap-1"
              >
                {geocoding ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                    Calcolo...
                  </>
                ) : (
                  <>
                    <MapPin className="w-3 h-3" aria-hidden="true" />
                    Calcola da indirizzo
                  </>
                )}
              </button>
            </div>

            {geocodingError && (
              <p className="text-xs text-error-600 mt-2">{geocodingError}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href="/admin/dashboard"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
          >
            Annulla
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition disabled:opacity-50"
          >
            {loading ? 'Creazione...' : 'Crea Ente'}
          </button>
        </div>
      </form>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-gray-500">Caricamento...</p>
    </div>
  );
}

export default function NewIntermediaryPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewIntermediaryContent />
    </Suspense>
  );
}
