'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProfileForm from '@/components/profile/ProfileForm';
import dynamic from 'next/dynamic';

const LocationMap = dynamic(() => import('@/components/map/LocationMap'), {
  ssr: false,
  loading: () => <div className="h-48 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center"><span className="text-gray-400">Caricamento mappa...</span></div>,
});

interface Organization {
  id: string;
  name: string;
  type: string;
  verified: boolean;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  fiscalCode: string;
  birthDate: string;
  address: string;
  houseNumber: string;
  city: string;
  cap: string;
  intermediaryOrg: Organization;
}

export default function IntermediaryProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<Organization | null>(null);
  const [orgLat, setOrgLat] = useState('');
  const [orgLng, setOrgLng] = useState('');
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [orgSuccess, setOrgSuccess] = useState(false);
  const [orgLoading, setOrgLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then(async (data) => {
        if (data.user) {
          setUser(data.user);
          // Fetch organization data
          const orgData = data.user.intermediaryOrg;
          setOrg(orgData);
          setOrgLat(orgData.latitude?.toString() || '');
          setOrgLng(orgData.longitude?.toString() || '');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const detectOrgLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalizzazione non supportata dal browser');
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrgLat(position.coords.latitude.toString());
        setOrgLng(position.coords.longitude.toString());
        setLocating(false);
        setOrgSuccess(false);
      },
      (err) => {
        setLocationError('Impossibile ottenere la posizione. Verifica i permessi.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const geocodeOrgAddress = async () => {
    if (!org?.address) {
      setLocationError('Indirizzo organizzazione non disponibile');
      return;
    }

    setGeocoding(true);
    setLocationError(null);

    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: org.address }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLocationError(data.error || 'Errore nel calcolo della posizione');
        return;
      }

      setOrgLat(data.latitude.toString());
      setOrgLng(data.longitude.toString());
      setOrgSuccess(false);
    } catch {
      setLocationError('Errore di connessione');
    } finally {
      setGeocoding(false);
    }
  };

  const saveOrgLocation = async () => {
    setOrgLoading(true);
    setLocationError(null);

    try {
      const res = await fetch('/api/organization/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: orgLat,
          longitude: orgLng,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLocationError(data.error || 'Errore durante il salvataggio');
        return;
      }

      setOrgSuccess(true);
      setTimeout(() => setOrgSuccess(false), 3000);
    } catch {
      setLocationError('Errore di connessione');
    } finally {
      setOrgLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">
          Sessione non trovata.{' '}
          <Link href="/auth/login" className="text-primary-600 hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    );
  }

  const hasOrgLocation = orgLat && orgLng;

  return (
    <div className="max-w-4xl p-6">
      <h1 className="text-3xl font-medium text-gray-900 mb-8 text-center">Il mio profilo</h1>

      {/* Editable Form */}
      <div className="mb-8">
        <ProfileForm user={user} role="INTERMEDIARY" />
      </div>

      {/* Organization Data */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>🏢</span> Dati organizzazione
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Nome organizzazione</p>
            <p className="font-medium text-gray-900">{user.intermediaryOrg?.name || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Tipo</p>
            <p className="font-medium text-gray-900">{user.intermediaryOrg?.type || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Indirizzo</p>
            <p className="font-medium text-gray-900">{user.intermediaryOrg?.address || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Stato verifica</p>
            <p className={`font-medium ${user.intermediaryOrg?.verified ? 'text-green-600' : 'text-yellow-600'}`}>
              {user.intermediaryOrg?.verified ? 'Verificato' : 'In verifica'}
            </p>
          </div>
        </div>
      </div>

      {/* Organization Geolocation */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <span>📍</span> Posizione organizzazione
          </h2>
          {orgSuccess && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              ✓ Salvato con successo
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {hasOrgLocation
            ? `Posizione registrata: ${parseFloat(orgLat).toFixed(4)}, ${parseFloat(orgLng).toFixed(4)}`
            : 'Nessuna posizione registrata'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            type="button"
            onClick={detectOrgLocation}
            disabled={locating}
            className="flex-1 px-4 py-2.5 bg-secondary-600 text-white text-sm font-medium rounded-lg hover:bg-secondary-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {locating ? (
              <>
                <span className="animate-spin">🔄</span>
                <span>Rilevamento...</span>
              </>
            ) : (
              <>
                <span>📡</span>
                <span>{hasOrgLocation ? 'Aggiorna con GPS' : 'Rileva con GPS'}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={geocodeOrgAddress}
            disabled={geocoding || !org?.address}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {geocoding ? (
              <>
                <span className="animate-spin">🔄</span>
                <span>Calcolo...</span>
              </>
            ) : (
              <>
                <span>🏠</span>
                <span>Calcola da indirizzo</span>
              </>
            )}
          </button>
        </div>

        {locationError && (
          <p className="text-sm text-red-600 mb-4">{locationError}</p>
        )}

        <button
          type="button"
          onClick={saveOrgLocation}
          disabled={orgLoading || !hasOrgLocation}
          className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition flex items-center gap-2"
        >
          {orgLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Salvataggio...</span>
            </>
          ) : (
            <>
              <span>💾</span>
              <span>Salva posizione</span>
            </>
          )}
        </button>

        {/* Map Display */}
        {hasOrgLocation && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span>🗺️</span> Anteprima posizione
            </h3>
            <LocationMap
              latitude={parseFloat(orgLat)}
              longitude={parseFloat(orgLng)}
              height="250px"
            />
          </div>
        )}
      </div>

      {/* Account info */}
      <div className="bg-gray-50 p-6 rounded-xl border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Informazioni account</h2>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-sm text-gray-500 mb-1">ID Utente</p>
            <p className="font-medium text-gray-900 font-mono">{user.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
