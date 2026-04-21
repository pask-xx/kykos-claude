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
  const defaultRole = searchParams.get('role')?.toUpperCase() as Role | null;

  const [intermediaries, setIntermediaries] = useState<Intermediary[]>([]);

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Role-specific fields
  const [role, setRole] = useState<Role>(defaultRole || 'DONOR');

  // Personal info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [fiscalCode, setFiscalCode] = useState('');
  const [address, setAddress] = useState('');
  const [cap, setCap] = useState('');
  const [city, setCity] = useState('');
  const [houseNumber, setHouseNumber] = useState('');

  // Intermediary fields
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<'CHARITY' | 'CHURCH' | 'ASSOCIATION'>('CHARITY');

  // Recipient fields
  const [referenceEntityId, setReferenceEntityId] = useState('');
  const [isee, setIsee] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role === 'RECIPIENT') {
      fetchIntermediaries();
    }
  }, [role]);

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

    if (password !== confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    if (password.length < 6) {
      setError('La password deve essere almeno 6 caratteri');
      return;
    }

    // Validation based on role
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
    }

    setLoading(true);

    try {
      const payload: Record<string, string> = {
        email,
        password,
        role,
        firstName,
        lastName,
        fiscalCode,
        address,
        cap,
        city,
        houseNumber,
      };

      // Only include optional fields if they have values (for donors)
      if (birthDate) payload.birthDate = birthDate;

      if (role === 'INTERMEDIARY') {
        payload.orgName = orgName;
        payload.orgType = orgType;
      }

      if (role === 'RECIPIENT') {
        payload.referenceEntityId = referenceEntityId;
        payload.isee = isee;
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

      switch (role) {
        case 'DONOR':
          router.push('/donor/dashboard');
          break;
        case 'RECIPIENT':
          router.push('/recipient/dashboard');
          break;
        case 'INTERMEDIARY':
          router.push('/intermediary/dashboard');
          break;
        default:
          router.push('/');
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const isRecipient = role === 'RECIPIENT';
  const isDonor = role === 'DONOR';

  return (
    <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
      <div className="w-full max-w-md py-8">
        <div className="lg:hidden mb-8">
          <h1 className="text-3xl font-bold text-primary-600">KYKOS</h1>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Crea un account</h2>
        <p className="text-gray-600 mb-8">Scegli come vuoi partecipare</p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Ruolo</label>
            <div className="grid grid-cols-3 gap-3">
              {(['DONOR', 'RECIPIENT', 'INTERMEDIARY'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`p-3 border-2 rounded-lg text-center transition ${
                    role === r
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-lg mb-1">
                    {r === 'DONOR' && '🎁'}
                    {r === 'RECIPIENT' && '🙏'}
                    {r === 'INTERMEDIARY' && '🏢'}
                  </span>
                  <span className="text-xs font-medium">
                    {r === 'DONOR' && 'Donatore'}
                    {r === 'RECIPIENT' && 'Ricevente'}
                    {r === 'INTERMEDIARY' && 'Ente'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Intermediary extra fields */}
          {role === 'INTERMEDIARY' && (
            <>
              <div>
                <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Organizzazione
                </label>
                <input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  placeholder="Caritas Diocesana..."
                />
              </div>
              <div>
                <label htmlFor="orgType" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo Organizzazione
                </label>
                <select
                  id="orgType"
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value as typeof orgType)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                >
                  <option value="CHARITY">Centro Caritas</option>
                  <option value="CHURCH">Parrocchia</option>
                  <option value="ASSOCIATION">Associazione</option>
                </select>
              </div>
            </>
          )}

          {/* Recipient specific fields */}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                >
                  <option value="">Seleziona un ente</option>
                  {intermediaries.map((int) => (
                    <option key={int.id} value={int.id}>
                      {int.name} - {int.address || int.type}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  L&apos;ente che ti ha autorizzato a ricevere
                </p>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  placeholder="Es: 5000.00"
                />
              </div>
            </>
          )}

          {/* Personal Info - Required for Recipient, Optional for Donor */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              {isRecipient ? 'Dati anagrafici *' : 'Dati anagrafici (facoltativo)'}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-xs text-gray-500 mb-1">
                  Nome *{isDonor && '(facoltativo)'}
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required={isRecipient}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-sm"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-xs text-gray-500 mb-1">
                  Cognome *{isDonor && '(facoltativo)'}
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required={isRecipient}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label htmlFor="birthDate" className="block text-xs text-gray-500 mb-1">
                  Data di nascita *{isDonor && '(facoltativo)'}
                </label>
                <input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required={isRecipient}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-sm uppercase"
                  placeholder="ABCDEF12G34H567"
                />
              </div>
            </div>

            <div className="mt-3">
              <label htmlFor="address" className="block text-xs text-gray-500 mb-1">
                Indirizzo *{isDonor && '(facoltativo)'}
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required={isRecipient}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-sm"
                placeholder="Via Roma"
              />
            </div>

            <div className="grid grid-cols-3 gap-4 mt-3">
              <div>
                <label htmlFor="cap" className="block text-xs text-gray-500 mb-1">
                  CAP *
                </label>
                <input
                  id="cap"
                  type="text"
                  value={cap}
                  onChange={(e) => setCap(e.target.value)}
                  required={isRecipient}
                  maxLength={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-sm"
                  placeholder="00100"
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-xs text-gray-500 mb-1">
                  Città *
                </label>
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required={isRecipient}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-sm"
                  placeholder="Roma"
                />
              </div>
              <div>
                <label htmlFor="houseNumber" className="block text-xs text-gray-500 mb-1">
                  N. Civico *
                </label>
                <input
                  id="houseNumber"
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  required={isRecipient}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-sm"
                  placeholder="15"
                />
              </div>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder="mario@email.com"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrazione in corso...' : 'Registrati'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-600">
          Hai già un account?{' '}
          <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary-600 to-secondary-800 p-12 flex-col justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">KYKOS</h1>
          <p className="text-secondary-100 mt-2">Dona con dignità, ricevi con gratitudine</p>
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💝</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">Unisciti a KYKOS</h3>
              <p className="text-secondary-100 text-sm">Inizia a donare o richiedere oggetti</p>
            </div>
          </div>
        </div>
        <p className="text-secondary-200 text-sm">© 2024 KYKOS. Tutti i diritti riservati.</p>
      </div>

      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><p>Caricamento...</p></div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
