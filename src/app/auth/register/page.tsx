'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Role } from '@/types';

interface Intermediary {
  id: string;
  name: string;
  type: string;
  address: string | null;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOAuth = searchParams.get('oauth') === '1';
  const oauthEmail = searchParams.get('email') || '';
  const oauthName = searchParams.get('name') || '';
  const defaultRole = (searchParams.get('role')?.toUpperCase() || 'DONOR') as Role;

  const [intermediaries, setIntermediaries] = useState<Intermediary[]>([]);

  // Common fields
  const [email, setEmail] = useState(oauthEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Role-specific fields
  const [role, setRole] = useState<Role>(defaultRole);

  // Personal info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [fiscalCode, setFiscalCode] = useState('');
  const [address, setAddress] = useState('');
  const [cap, setCap] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [houseNumber, setHouseNumber] = useState('');

  // Recipient fields
  const [referenceEntityId, setReferenceEntityId] = useState('');
  const [isee, setIsee] = useState('');

  // Geolocation
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [locationError, setLocationError] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role === 'RECIPIENT') {
      fetchIntermediaries();
    }
    if (isOAuth && oauthName) {
      const parts = oauthName.split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
  }, [role, isOAuth, oauthName]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalizzazione non supportata');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toString());
        setLongitude(pos.coords.longitude.toString());
        setLocating(false);
      },
      (err) => {
        setLocationError('Permessi negati o posizione non disponibile');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const geocodeFromAddress = async () => {
    if (!address || !city) {
      setLocationError('Inserisci indirizzo e città');
      return;
    }
    setGeocoding(true);
    setLocationError('');
    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, city, cap, province }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLocationError(data.error || 'Errore nel calcolo della posizione');
        return;
      }
      setLatitude(data.latitude.toString());
      setLongitude(data.longitude.toString());
    } catch {
      setLocationError('Errore di connessione');
    } finally {
      setGeocoding(false);
    }
  };

  const fetchIntermediaries = async () => {
    try {
      const res = await fetch('/api/intermediaries');
      const data = await res.json();
      setIntermediaries(data.intermediaries || []);
    } catch (err) {
      console.error('Error fetching intermediaries:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isOAuth) {
      if (password !== confirmPassword) {
        setError('Le password non coincidono');
        return;
      }

      if (password.length < 6) {
        setError('La password deve essere almeno 6 caratteri');
        return;
      }
    }

    if (role === 'RECIPIENT') {
      if (!firstName || !lastName || !birthDate || !fiscalCode || !address || !cap || !city || !houseNumber) {
        setError('Tutti i campi anagrafici sono obbligatori per i riceventi');
        return;
      }
      if (!referenceEntityId) {
        setError('Seleziona un ente di riferimento');
        return;
      }
      if (!isee) {
        setError('Inserisci il valore ISEE');
        return;
      }
      if (!latitude || !longitude) {
        setError('La geolocalizzazione è obbligatoria per i riceventi');
        return;
      }
    }

    setLoading(true);

    try {
      const payload: Record<string, string> = {
        email,
        role,
        firstName,
        lastName,
        fiscalCode,
        address,
        cap,
        city,
        houseNumber,
      };

      if (!isOAuth) {
        payload.password = password;
      } else {
        payload.oauthProvider = 'google';
      }

      if (birthDate) payload.birthDate = birthDate;

      if (role === 'RECIPIENT') {
        payload.referenceEntityId = referenceEntityId;
        payload.isee = isee;
      }

      if (latitude && longitude) {
        payload.latitude = latitude;
        payload.longitude = longitude;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registrazione fallita');
        return;
      }

      router.push('/profile/complete');
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = `/api/auth/google?role=${role.toLowerCase()}`;
  };

  const isRecipient = role === 'RECIPIENT';
  const isDonor = role === 'DONOR';

  return (
    <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto bg-gray-50">
      <div className="w-full max-w-md py-8">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-3">
          <img src="/albero.svg" alt="KYKOS" className="w-12 h-12" />
          <span className="text-3xl font-bold text-secondary-600">KYKOS</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Crea un account</h2>
        <p className="text-gray-600 mb-6">Scegli come vuoi partecipare</p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Ruolo</label>
            <div className="grid grid-cols-2 gap-3">
              {(['DONOR', 'RECIPIENT'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`p-4 border-2 rounded-xl text-center transition ${
                    role === r
                      ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-2xl mb-1">
                    {r === 'DONOR' && '🎁'}
                    {r === 'RECIPIENT' && '🙏'}
                  </span>
                  <span className="text-sm font-medium">
                    {r === 'DONOR' && 'Donatore'}
                    {r === 'RECIPIENT' && 'Ricevente'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* recipient specific fields */}
          {role === 'RECIPIENT' && (
            <>
              <div>
                <label htmlFor="referenceEntity" className="block text-sm font-medium text-gray-700 mb-2">
                  Ente di riferimento *
                </label>
                <select
                  id="referenceEntity"
                  value={referenceEntityId}
                  onChange={(e) => setReferenceEntityId(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition"
                >
                  <option value="">Seleziona un ente</option>
                  {intermediaries.map((int) => (
                    <option key={int.id} value={int.id}>
                      {int.name} - {int.address || int.type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="isee" className="block text-sm font-medium text-gray-700 mb-2">
                  Valore ISEE *
                </label>
                <input
                  id="isee"
                  type="number"
                  step="0.01"
                  value={isee}
                  onChange={(e) => setIsee(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition"
                  placeholder="Es: 5000.00"
                />
              </div>
            </>
          )}

          {/* Personal Info */}
          <div className="border-t pt-5">
            <p className="text-sm font-medium text-gray-700 mb-3">
              {isRecipient ? 'Dati anagrafici *' : 'Dati anagrafici (facoltativo)'}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-xs text-gray-500 mb-1">
                  Nome *
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required={isRecipient}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition text-sm"
                  placeholder="Mario"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-xs text-gray-500 mb-1">
                  Cognome *
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required={isRecipient}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition text-sm"
                  placeholder="Rossi"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label htmlFor="birthDate" className="block text-xs text-gray-500 mb-1">
                  Data di nascita *
                </label>
                <input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required={isRecipient}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition text-sm"
                />
              </div>
              <div>
                <label htmlFor="fiscalCode" className="block text-xs text-gray-500 mb-1">
                  Codice Fiscale *
                </label>
                <input
                  id="fiscalCode"
                  type="text"
                  value={fiscalCode}
                  onChange={(e) => setFiscalCode(e.target.value.toUpperCase())}
                  required={isRecipient}
                  maxLength={16}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition text-sm uppercase"
                  placeholder="ABCDEF12G34H567"
                />
              </div>
            </div>

            <div className="mt-3">
              <label htmlFor="address" className="block text-xs text-gray-500 mb-1">
                Indirizzo *
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required={isRecipient}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition text-sm"
                placeholder="Via Roma"
              />
            </div>

            <div className="grid grid-cols-4 gap-4 mt-3">
              <div>
                <label htmlFor="cap" className="block text-xs text-gray-500 mb-1">CAP *</label>
                <input
                  id="cap"
                  type="text"
                  value={cap}
                  onChange={(e) => setCap(e.target.value)}
                  required={isRecipient}
                  maxLength={5}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition text-sm"
                  placeholder="00100"
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-xs text-gray-500 mb-1">Città *</label>
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required={isRecipient}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition text-sm"
                  placeholder="Roma"
                />
              </div>
              <div>
                <label htmlFor="province" className="block text-xs text-gray-500 mb-1">Prov *</label>
                <input
                  id="province"
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value.toUpperCase())}
                  required={isRecipient}
                  maxLength={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition text-sm uppercase"
                  placeholder="RM"
                />
              </div>
              <div>
                <label htmlFor="houseNumber" className="block text-xs text-gray-500 mb-1">N. Civico *</label>
                <input
                  id="houseNumber"
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  required={isRecipient}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition text-sm"
                  placeholder="15"
                />
              </div>
            </div>

            {/* Geolocation Section - Required for RECIPIENT, Optional for DONOR */}
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="font-medium text-gray-900 flex items-center gap-2 text-sm mb-2">
                <span>📍</span> Geolocalizzazione
                {isRecipient && <span className="text-red-500">*</span>}
                {!isRecipient && <span className="text-gray-400 text-xs">(facoltativa)</span>}
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                {latitude && longitude
                  ? `Posizione: ${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}`
                  : 'Non rilevata'}
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={locating}
                  className="flex-1 px-3 py-2 bg-secondary-600 text-white text-xs font-medium rounded-lg hover:bg-secondary-700 disabled:opacity-50 transition flex items-center justify-center gap-1"
                >
                  {locating ? '⏳ Rilevamento...' : '📡 GPS'}
                </button>
                <button
                  type="button"
                  onClick={geocodeFromAddress}
                  disabled={geocoding || !address || !city}
                  className="flex-1 px-3 py-2 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition flex items-center justify-center gap-1"
                >
                  {geocoding ? '⏳ Calcolo...' : '🏠 Da indirizzo'}
                </button>
              </div>

              {locationError && (
                <p className="text-xs text-red-600 mt-2">{locationError}</p>
              )}
              {isRecipient && !latitude && (
                <p className="text-xs text-secondary-600 mt-2">
                  Obbligatoria per completare la registrazione
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isOAuth}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition disabled:bg-gray-100"
              placeholder="mario@email.com"
            />
          </div>

          {/* Password - only for non-OAuth */}
          {!isOAuth && (
            <>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition"
                  placeholder="Minimo 6 caratteri"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Conferma Password *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition"
                  placeholder="••••••••"
                />
              </div>
            </>
          )}

          {isOAuth && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Account Google - password non richiesta
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-secondary-600 text-white font-semibold rounded-lg hover:bg-secondary-700 focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Registrazione...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Registrati</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 text-gray-500">oppure</span>
            </div>
          </div>

          <div className="mt-6">
            <a
              href="/api/auth/google"
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700 bg-white"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Registrati con Google
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-gray-600 text-sm">
          Hai già un account?{' '}
          <Link href="/auth/login" className="text-secondary-600 hover:text-secondary-700 font-medium">
            Accedi
          </Link>
        </p>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-secondary-600 transition">
            ← Torna alla home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary-600 to-secondary-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <img src="/albero.svg" alt="KYKOS" className="w-14 h-14" />
            <span className="text-4xl font-bold text-white">KYKOS</span>
          </Link>
          <p className="text-secondary-100 mt-3 text-lg">Dona con dignità, ricevi con gratitudine</p>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-3xl">🎁</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Dona i tuoi oggetti</h3>
              <p className="text-secondary-100 text-sm">Libri, vestiti, elettrodomestici e altro</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-3xl">🙏</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Richiedi ciò di cui hai bisogno</h3>
              <p className="text-secondary-100 text-sm">Con un piccolo contributo simbolico</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-3xl">🏢</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Enti verificati</h3>
              <p className="text-secondary-100 text-sm">Gestiscono tutto in sicurezza</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-secondary-200 text-sm">
          © 2024 KYKOS. Tutti i diritti riservati.
        </p>
      </div>

      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><p>Caricamento...</p></div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
