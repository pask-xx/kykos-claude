'use client';

import { useState, Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Gift, Heart, Home, MapPin, Satellite, Sparkles, Loader2 } from 'lucide-react';
import { Role } from '@/types';
import CitySelector from '@/components/geo/CitySelector';
import PdfViewerModal from '@/components/PdfViewerModal';
import { Button, Modal, ModalFooter } from '@/components/ui';

interface Diocese {
  id: string;
  name: string;
  seat: string;
  distance: number;
}

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

  // Force DONOR if INTERMEDIARY is passed via URL (registration by admins only)
  const initialRole = (defaultRole === 'INTERMEDIARY' ? 'DONOR' : defaultRole) as Role;

  const [intermediaries, setIntermediaries] = useState<Intermediary[]>([]);
  const [dioceses, setDioceses] = useState<Diocese[]>([]);

  // Common fields
  const [email, setEmail] = useState(oauthEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Role-specific fields
  const [role, setRole] = useState<Role>(initialRole);

  // Personal info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [generatingNickname, setGeneratingNickname] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [fiscalCode, setFiscalCode] = useState('');
  const [address, setAddress] = useState('');
  const [cap, setCap] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [cityCoords, setCityCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const [houseNumber, setHouseNumber] = useState('');

  // Intermediary fields
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('');
  const [dioceseId, setDioceseId] = useState('');

  // Diocese field (mandatory for all roles)
  const [selectedDioceseId, setSelectedDioceseId] = useState('');

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
  const [secret, setSecret] = useState('');

  // Modale di cortesia: se l'utente prova a registrarsi senza codice (o con
  // codice sbagliato, 403 lato server) gli proponiamo due opzioni esplicite
  // invece di redirigerlo a sorpresa. Così chi ha già un invito può
  // correggere il modulo, chi non ce l'ha atterra sulla landing di
  // adesione. Vedi handleSubmit per i punti in cui viene aperta.
  const [showSecretModal, setShowSecretModal] = useState(false);
  // Ref al campo "Codice di registrazione": quando l'utente sceglie
  // "Inserisci codice" dalla modale, scrolliamo al campo e gli diamo focus.
  const secretInputRef = useRef<HTMLInputElement | null>(null);

  const handleSecretModalEnterCode = () => {
    setShowSecretModal(false);
    // Microtask così la modale finisce di smontarsi prima dello scroll.
    setTimeout(() => {
      secretInputRef.current?.focus();
      secretInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const handleSecretModalNotify = () => {
    setShowSecretModal(false);
    router.push('/registrations-closed');
  };

  // Legal consent (GDPR) — both checkboxes must be checked before submit.
  // The server-side version + hash are recorded together with IP/UA at
  // registration time, so the user can't accept "an old version" or skip
  // the proof. See src/app/api/auth/register/route.ts and src/lib/legal.ts.
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  // PDF viewer modal: 'privacy' | 'terms' | null. Apre il PDF in-page invece
  // di un nuovo tab (più affidabile su mobile, dove alcuni browser non
  // tornano agevolmente alla pagina precedente).
  const [pdfOpen, setPdfOpen] = useState<null | { url: string; title: string }>(null);

  // Versioni correnti dei documenti legali, caricate da /api/legal/current
  // (pubblica) al mount. null mentre il fetch è in corso: le checkbox sono
  // disabilitate per evitare che l'utente accetti "una versione sconosciuta".
  // Se il fetch fallisce, fallback a null e le checkbox restano disabilitate
  // con un messaggio d'errore — l'utente NON può registrarsi senza aver
  // prima letto i documenti aggiornati.
  const [legalDocs, setLegalDocs] = useState<{
    PRIVACY: { version: string; url: string } | null;
    TERMS: { version: string; url: string } | null;
  }>({ PRIVACY: null, TERMS: null });
  const [legalDocsError, setLegalDocsError] = useState<string | null>(null);

  const isStagingSecretEnabled = process.env.NEXT_PUBLIC_STAGING_REGISTRATION_SECRET_ENABLED === 'true';

  useEffect(() => {
    if (isOAuth && oauthName) {
      const parts = oauthName.split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
  }, [isOAuth, oauthName]);

  // Carica le versioni correnti dei documenti legali da /api/legal/current
  // (pubblica). Necessario perché /auth/register è una pagina per utenti NON
  // ancora loggati, quindi /api/legal/status (che richiede auth) non è
  // accessibile. Senza questi dati le checkbox restano disabilitate e
  // l'utente NON può registrarsi — l'obiettivo è che legga la versione
  // corrente, non un PDF statico vecchio.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/legal/current', { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) {
            setLegalDocsError(
              'Impossibile caricare i documenti legali correnti. Riprova più tardi.'
            );
          }
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setLegalDocs({
            PRIVACY: data.documents?.PRIVACY ?? null,
            TERMS: data.documents?.TERMS ?? null,
          });
        }
      } catch (err) {
        console.error('Error fetching /api/legal/current:', err);
        if (!cancelled) {
          setLegalDocsError(
            'Impossibile caricare i documenti legali correnti. Riprova più tardi.'
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch intermediaries and dioceses when location is detected
  useEffect(() => {
    if (latitude && longitude) {
      fetchDioceses();
      if (role === 'RECIPIENT') {
        fetchIntermediaries();
      }
    }
  }, [role, latitude, longitude]);

  const fetchDioceses = async () => {
    try {
      const res = await fetch(`/api/dioceses?lat=${latitude}&lng=${longitude}&radius=50`);
      const data = await res.json();
      setDioceses(data.dioceses || []);
    } catch (err) {
      console.error('Error fetching dioceses:', err);
    }
  };

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
        // Reset entity selection when location changes
        setReferenceEntityId('');
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
      // Reset entity selection when location changes
      setReferenceEntityId('');
    } catch {
      setLocationError('Errore di connessione');
    } finally {
      setGeocoding(false);
    }
  };

  const fetchIntermediaries = async () => {
    try {
      const res = await fetch(`/api/intermediaries?lat=${latitude}&lng=${longitude}&radius=30`);
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

    if (isStagingSecretEnabled && !secret) {
      // Codice mancante: apri la modale di cortesia ("hai un codice? inseriscilo,
      // altrimenti lasciaci la mail"). Solo se l'utente sceglie
      // esplicitamente "Avvisami" lo portiamo sulla landing.
      setShowSecretModal(true);
      return;
    }

    // Legal consent: obbligatorio ai sensi del GDPR (Reg. UE 2016/679) e
    // della normativa italiana. L'utente deve dichiarare di aver letto sia
    // l'informativa privacy sia le condizioni d'uso. Senza → registrazione
    // non può procedere.
    // Blocco anche se le versioni correnti non sono state caricate: l'utente
    // non può aver letto nulla se non conosce la versione da accettare.
    if (!legalDocs.PRIVACY || !legalDocs.TERMS) {
      setError('Documenti legali non ancora disponibili, riprova tra qualche secondo.');
      return;
    }
    if (!acceptTerms || !acceptPrivacy) {
      setError("Devi accettare l'Informativa Privacy e le Condizioni d'uso per procedere");
      return;
    }

    // Diocese is mandatory for all roles
    if (!selectedDioceseId) {
      setError('Seleziona una diocesi di appartenenza');
      return;
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

    if (role === 'INTERMEDIARY') {
      if (!firstName || !lastName || !birthDate || !fiscalCode || !address || !cap || !city || !houseNumber) {
        setError('Tutti i campi anagrafici sono obbligatori per gli enti');
        return;
      }
      if (!orgName || !orgType) {
        setError('Nome e tipo organizzazione sono obbligatori per gli enti');
        return;
      }
      if (!latitude || !longitude) {
        setError('La geolocalizzazione è obbligatoria per gli enti');
        return;
      }
    }

    setLoading(true);

    try {
      const payload: Record<string, string> = {
        email,
        role,
        nickname,
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

      if (secret) {
        payload.secret = secret;
      }

      // Use user-provided coordinates if available, otherwise fall back to city coordinates
      const lat = latitude || (cityCoords.lat ? cityCoords.lat.toString() : null);
      const lng = longitude || (cityCoords.lng ? cityCoords.lng.toString() : null);

      if (lat && lng) {
        payload.latitude = lat;
        payload.longitude = lng;
      }

      // Diocese is mandatory for all roles
      payload.dioceseId = selectedDioceseId;

      if (role === 'INTERMEDIARY') {
        if (!orgName || !orgType) {
          setError('Nome e tipo organizzazione sono obbligatori per gli enti');
          return;
        }
        payload.orgName = orgName;
        payload.orgType = orgType;
      }

      // Legal consent flags — server-side validates and stores with IP+UA.
      payload.acceptTerms = acceptTerms ? 'true' : 'false';
      payload.acceptPrivacy = acceptPrivacy ? 'true' : 'false';

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        // 403 con "Codice di registrazione non valido" → codice inserito ma
        // non corrisponde a STAGING_REGISTRATION_SECRET. Stessa modale del
        // caso "codice mancante": offriamo all'utente la possibilità di
        // correggere (magari ha sbagliato a digitarlo) o di andare sulla
        // landing di adesione. Niente redirect silenzioso.
        if (res.status === 403 && data.error === 'Codice di registrazione non valido') {
          setShowSecretModal(true);
          return;
        }
        setError(data.error || 'Registrazione fallita');
        return;
      }

      // Redirect to email confirmation notice page
      router.push(`/auth/confirm?email=${encodeURIComponent(email)}`);
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
          <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-12" />
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
          <div role="group" aria-labelledby="role-heading">
            <span id="role-heading" className="block text-sm font-medium text-gray-700 mb-3">Ruolo</span>
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
                    {r === 'DONOR' && <Gift className="h-6 w-6 mx-auto" aria-hidden="true" />}
                    {r === 'RECIPIENT' && <Heart className="h-6 w-6 mx-auto" aria-hidden="true" />}
                  </span>
                  <span className="text-sm font-medium">
                    {r === 'DONOR' && 'Donatore'}
                    {r === 'RECIPIENT' && 'Beneficiario'}
                  </span>
                </button>
              ))}
            </div>
          </div>

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

            {/* Nickname - Optional with Generate button */}
            <div className="mt-3">
              <label htmlFor="nickname" className="block text-xs text-gray-500 mb-1">
                Nickname (facoltativo)
              </label>
              <div className="flex gap-2">
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, ''))}
                  maxLength={30}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition text-sm"
                  placeholder="Scegli un nickname"
                />
                <button
                  type="button"
                  onClick={async () => {
                    setGeneratingNickname(true);
                    try {
                      // Generate a fantasy nickname in Italian
                      const adjectives = ['buono', 'gentile', 'caldo', 'luminoso', 'mite', 'sereno', 'solare', 'felice', 'saggio', 'ardito', 'coraggioso', 'giusto', 'puro', 'lucente', 'pacifico', 'grazioso', 'speranzoso', 'allegro', 'fiducioso', 'rapido', 'selvaggio', 'delicato', 'amorevole', 'premuroso', 'generoso', 'nobile'];
                      const nouns = ['cuore', 'anima', 'spirito', 'sogno', 'speranza', 'sole', 'stella', 'luna', 'nuvola', 'pioggia', 'vento', 'fiore', 'albero', 'uccello', 'foglia', 'fiume', 'montagna', 'oceano', 'foresta', 'giardino', 'melodia', 'armonia', 'sapienza', 'coraggio', 'pace', 'gioia'];
                      const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
                      const adj = pick(adjectives);
                      const noun = pick(nouns);
                      const num = Math.floor(Math.random() * 999) + 1;
                      setNickname(`${adj}.${noun}.${num}`);
                    } finally {
                      setGeneratingNickname(false);
                    }
                  }}
                  disabled={generatingNickname}
                  className="px-4 py-2 bg-secondary-100 text-secondary-700 text-sm font-medium rounded-lg hover:bg-secondary-200 disabled:opacity-50 transition"
                >
                  {generatingNickname ? '...' : 'Genera'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Usato dagli enti per identificarti. Scegli tu o clicca "Genera".
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
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

            <div className="flex gap-4 mt-3">
              <div className="flex-[17]">
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
              <div className="flex-[3]">
                <label htmlFor="houseNumber" className="block text-xs text-gray-500 mb-1">N.</label>
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

            <div className="flex gap-4 mt-3">
              <div className="flex-[4]">
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
              <div className="flex-[8]">
                <CitySelector
                  selectedProvince={province}
                  selectedCity={city}
                  onProvinceChange={setProvince}
                  onCityChange={(name, lat, lng) => {
                    setCity(name);
                    setCityCoords({ lat: lat ?? null, lng: lng ?? null });
                  }}
                  required={isRecipient}
                />
              </div>
            </div>

            {/* Geolocation Section - Required for RECIPIENT and INTERMEDIARY, Optional for DONOR */}
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="font-medium text-gray-900 flex items-center gap-2 text-sm mb-2">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Geolocalizzazione
                {(isRecipient || role === 'INTERMEDIARY') && <span className="text-red-500">*</span>}
                {isDonor && <span className="text-gray-400 text-xs">(facoltativa)</span>}
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                {latitude && longitude
                  ? `Posizione: ${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}`
                  : 'Non rilevata'}
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={detectLocation}
                  loading={locating}
                  className="flex-1"
                >
                  {locating ? 'Rilevamento...' : (
                    <>
                      <Satellite className="h-3.5 w-3.5" aria-hidden="true" />
                      GPS
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={geocodeFromAddress}
                  loading={geocoding}
                  disabled={!address || !city}
                  className="flex-1"
                >
                  {geocoding ? 'Calcolo...' : (
                    <>
                      <Home className="h-3.5 w-3.5" aria-hidden="true" />
                      Da indirizzo
                    </>
                  )}
                </Button>
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

            {/* Diocese Selection - Mandatory for all roles */}
            <div className="mt-4">
              <label htmlFor="diocese" className="block text-sm font-medium text-gray-700 mb-2">
                Diocesi di appartenenza <span className="text-red-500">*</span>
              </label>
              {!latitude || !longitude ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 text-sm">
                  Rileva prima la posizione per vedere le diocesi vicine
                </div>
              ) : (
                <select
                  id="diocese"
                  value={selectedDioceseId}
                  onChange={(e) => setSelectedDioceseId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
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
                Obbligatoria. Ti permette di vedere le richieste della tua diocesi.
              </p>
            </div>
          </div>

          {/* Intermediary specific fields */}
          {role === 'INTERMEDIARY' && (
            <div className="border-t pt-5">
              <p className="text-sm font-medium text-gray-700 mb-3">Dati ente *</p>
              <div className="mb-3">
                <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome dell'ente *
                </label>
                <input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required={role === 'INTERMEDIARY'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition"
                  placeholder="Caritas Italiana"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="orgType" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo ente *
                </label>
                <select
                  id="orgType"
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                  required={role === 'INTERMEDIARY'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition"
                >
                  <option value="">Seleziona tipo</option>
                  <option value="CHURCH">Ente Ecclesiale</option>
                  <option value="CHARITY">Associazione / Fondazione</option>
                  <option value="ASSOCIATION">Altro</option>
                </select>
              </div>
            </div>
          )}

          {/* Recipient specific fields - at the end */}
          {role === 'RECIPIENT' && (
            <div className="border-t pt-5">
              <p className="text-sm font-medium text-gray-700 mb-3">Dati ricevente *</p>
              <div>
                <label htmlFor="referenceEntity" className="block text-sm font-medium text-gray-700 mb-2">
                  Ente di riferimento *
                </label>
                {!latitude || !longitude ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 text-sm">
                    Rileva prima la posizione per vedere gli enti disponibili
                  </div>
                ) : (
                  <select
                    id="referenceEntity"
                    value={referenceEntityId}
                    onChange={(e) => setReferenceEntityId(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition"
                  >
                    <option value="">Seleziona un ente ({intermediaries.length} disponibili)</option>
                    {intermediaries.map((int) => (
                      <option key={int.id} value={int.id}>
                        {int.name} - {int.address || int.type}
                        {typeof (int as any).distance === 'number' ? ` (${(int as any).distance.toFixed(1)} km)` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="mt-3">
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
            </div>
          )}

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

          {isStagingSecretEnabled && (
            <div>
              <label htmlFor="secret" className="block text-sm font-medium text-gray-700 mb-2">
                Codice di registrazione *
              </label>
              <input
                id="secret"
                ref={secretInputRef}
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                pattern="\d{4}"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition text-center text-2xl tracking-widest font-mono"
                placeholder="••••"
              />
              <p className="text-xs text-gray-500 mt-1">Richiesto per completare la registrazione</p>
            </div>
          )}

          {/* Legal consent (GDPR) — required. I link aprono i PDF in nuova tab. */}
          <div className="border-t pt-5 space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Consensi obbligatori *
            </p>

            {legalDocsError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {legalDocsError}
              </div>
            )}

            {!legalDocsError && (!legalDocs.PRIVACY || !legalDocs.TERMS) && (
              <div className="p-3 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-sm">
                Caricamento documenti legali in corso…
              </div>
            )}

            <label htmlFor="accept-privacy" className="flex items-start gap-3 cursor-pointer group">
              <input
                id="accept-privacy"
                type="checkbox"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                required
                disabled={!legalDocs.PRIVACY}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-secondary-600 focus:ring-secondary-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                Ho letto e accetto l&apos;
                <button
                  type="button"
                  disabled={!legalDocs.PRIVACY}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (legalDocs.PRIVACY) {
                      setPdfOpen({
                        url: legalDocs.PRIVACY.url,
                        title: `Informativa Privacy v${legalDocs.PRIVACY.version}`,
                      });
                    }
                  }}
                  className="text-secondary-600 hover:text-secondary-700 underline font-medium disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                >
                  Informativa Privacy
                  {legalDocs.PRIVACY && ` v${legalDocs.PRIVACY.version}`}
                </button>
                {' '}ai sensi dell&apos;art. 13 del Regolamento UE 2016/679 (GDPR).
              </span>
            </label>

            <label htmlFor="accept-terms" className="flex items-start gap-3 cursor-pointer group">
              <input
                id="accept-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                required
                disabled={!legalDocs.TERMS}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-secondary-600 focus:ring-secondary-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                Ho letto e accetto le{' '}
                <button
                  type="button"
                  disabled={!legalDocs.TERMS}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (legalDocs.TERMS) {
                      setPdfOpen({
                        url: legalDocs.TERMS.url,
                        title: `Condizioni d'uso v${legalDocs.TERMS.version}`,
                      });
                    }
                  }}
                  className="text-secondary-600 hover:text-secondary-700 underline font-medium disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                >
                  Condizioni d&apos;uso
                  {legalDocs.TERMS && ` v${legalDocs.TERMS.version}`}
                </button>
                {' '}del servizio KYKOS.
              </span>
            </label>

            <p className="text-xs text-gray-500">
              I consensi verranno registrati con la versione dei documenti,
              un hash crittografico del PDF, il tuo indirizzo IP e User-Agent
              per la prova legale ai sensi del Provvedimento del Garante
              Privacy n. 229/2014.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-secondary-600 text-white font-semibold rounded-lg hover:bg-secondary-700 focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Registrazione...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Registrati</span>
              </>
            )}
          </button>
        </form>

        {/* PDF viewer modal (apre Privacy o ToS in-page, niente cambio tab) */}
        {pdfOpen && (
          <PdfViewerModal
            url={pdfOpen.url}
            title={pdfOpen.title}
            onClose={() => setPdfOpen(null)}
          />
        )}

        {/* Modale di cortesia: codice mancante o errato. Offre due percorsi
            espliciti — tornare al campo codice, oppure andare sulla landing
            di adesione — invece di un redirect silenzioso. */}
        <Modal
          isOpen={showSecretModal}
          onClose={() => setShowSecretModal(false)}
          title="Registrazione con invito"
          size="md"
        >
          <div className="p-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              La registrazione a KYKOS è attualmente riservata a chi ha ricevuto
              un <strong>codice di invito</strong> a 4 cifre.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Se lo hai, inseriscilo nel campo <em>Codice di registrazione</em> del
              modulo e riprova. Altrimenti lasciaci la tua email e ti avviseremo
              non appena le iscrizioni saranno aperte a tutti.
            </p>
          </div>
          <ModalFooter>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={handleSecretModalNotify}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Avvisami quando aprite
              </button>
              <button
                type="button"
                onClick={handleSecretModalEnterCode}
                className="px-5 py-2.5 bg-secondary-600 text-white font-medium rounded-lg hover:bg-secondary-700 transition"
              >
                Inserisci il codice
              </button>
            </div>
          </ModalFooter>
        </Modal>

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
      {/* Left side - Branding (fixed, non scrollabile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary-600 to-secondary-800 p-12 flex-col justify-between relative overflow-hidden sticky top-0 h-screen">
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <img src="/albero.svg" alt="KYKOS" className="h-14" />
            <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-14" />
          </Link>
          <p className="text-secondary-100 mt-3 text-lg">Dona con amore, ricevi con dignità</p>
        </div>

        <div className="relative z-10 space-y-8 flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Gift className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Dona i tuoi oggetti</h3>
              <p className="text-secondary-100 text-sm">Libri, vestiti, elettrodomestici e altro</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Heart className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Richiedi ciò di cui hai bisogno</h3>
              <p className="text-secondary-100 text-sm">Con un piccolo contributo simbolico</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Building2 className="h-7 w-7 text-white" aria-hidden="true" />
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
