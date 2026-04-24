'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const LocationMap = dynamic(() => import('@/components/map/LocationMap'), {
  ssr: false,
  loading: () => <div className="h-48 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center"><span className="text-gray-400">Caricamento mappa...</span></div>,
});

interface ProfileFormProps {
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    fiscalCode?: string | null;
    birthDate?: string | null;
    address?: string | null;
    houseNumber?: string | null;
    city?: string | null;
    cap?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  role: 'DONOR' | 'RECIPIENT' | 'INTERMEDIARY';
}

export default function ProfileForm({ user, role }: ProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    fiscalCode: user.fiscalCode || '',
    birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
    address: user.address || '',
    houseNumber: user.houseNumber || '',
    city: user.city || '',
    cap: user.cap || '',
    latitude: user.latitude?.toString() || '',
    longitude: user.longitude?.toString() || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSuccess(false);
    setError(null);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalizzazione non supportata dal browser');
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));
        setLocating(false);
        setSuccess(false);
      },
      (err) => {
        setLocationError('Impossibile ottenere la posizione. Verifica i permessi.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const geocodeFromAddress = async () => {
    if (!formData.address || !formData.city) {
      setLocationError('Inserisci indirizzo e città per calcolare la posizione');
      return;
    }

    setGeocoding(true);
    setLocationError(null);

    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: formData.address,
          city: formData.city,
          cap: formData.cap,
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
      setSuccess(false);
    } catch {
      setLocationError('Errore di connessione');
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore durante il salvataggio');
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  const hasLocation = formData.latitude && formData.longitude;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <span>✏️</span> Modifica profilo
        </h2>
        {success && (
          <span className="text-sm text-green-600 font-medium flex items-center gap-1">
            ✓ Salvato con successo
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className={labelClass}>Nome *</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className={inputClass}
              placeholder="Mario"
            />
          </div>
          <div>
            <label htmlFor="lastName" className={labelClass}>Cognome *</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className={inputClass}
              placeholder="Rossi"
            />
          </div>
          <div>
            <label htmlFor="fiscalCode" className={labelClass}>Codice Fiscale *</label>
            <input
              type="text"
              id="fiscalCode"
              name="fiscalCode"
              value={formData.fiscalCode}
              onChange={handleChange}
              required
              maxLength={16}
              className={`${inputClass} uppercase`}
              placeholder="RSSMRA85T10A562U"
            />
          </div>
          <div>
            <label htmlFor="birthDate" className={labelClass}>Data di nascita</label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="address" className={labelClass}>Indirizzo</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={inputClass}
              placeholder="Via Roma, 123"
            />
          </div>
          <div>
            <label htmlFor="houseNumber" className={labelClass}>Numero civico</label>
            <input
              type="text"
              id="houseNumber"
              name="houseNumber"
              value={formData.houseNumber}
              onChange={handleChange}
              className={inputClass}
              placeholder="123"
            />
          </div>
          <div>
            <label htmlFor="cap" className={labelClass}>CAP</label>
            <input
              type="text"
              id="cap"
              name="cap"
              value={formData.cap}
              onChange={handleChange}
              className={inputClass}
              placeholder="00100"
              maxLength={5}
            />
          </div>
          <div>
            <label htmlFor="city" className={labelClass}>Città</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={inputClass}
              placeholder="Roma"
            />
          </div>
        </div>

        {/* Geolocation Section */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
            <span>📍</span> Geolocalizzazione
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {hasLocation
              ? `Posizione registrata: ${parseFloat(formData.latitude!).toFixed(4)}, ${parseFloat(formData.longitude!).toFixed(4)}`
              : 'Nessuna posizione registrata'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={detectLocation}
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
                  <span>{hasLocation ? 'Aggiorna con GPS' : 'Rileva con GPS'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={geocodeFromAddress}
              disabled={geocoding || !formData.address || !formData.city}
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
            <p className="text-sm text-red-600 mt-2">{locationError}</p>
          )}
          <p className="text-xs text-gray-400 mt-3">
            Usa il GPS per rilevamento automatico, oppure inserisci il tuo indirizzo e clicca "Calcola da indirizzo".
          </p>
        </div>

        {/* Map Display */}
        {hasLocation && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span>🗺️</span> Anteprima posizione
            </h3>
            <LocationMap
              latitude={parseFloat(formData.latitude!)}
              longitude={parseFloat(formData.longitude!)}
              height="250px"
            />
          </div>
        )}

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">* Campi obbligatori</p>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Salvataggio...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Salva modifiche</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
