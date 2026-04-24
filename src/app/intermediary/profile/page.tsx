'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PasswordChangeForm from '@/components/profile/PasswordChangeForm';
import dynamic from 'next/dynamic';

const LocationMap = dynamic(() => import('@/components/map/LocationMap'), {
  ssr: false,
  loading: () => <div className="h-48 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center"><span className="text-gray-400">Caricamento mappa...</span></div>,
});

interface Organization {
  id: string;
  code: string;
  name: string;
  type: string;
  vatNumber: string | null;
  verified: boolean;
  address: string | null;
  houseNumber: string | null;
  cap: string | null;
  city: string | null;
  province: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface FormData {
  name: string;
  vatNumber: string;
  address: string;
  houseNumber: string;
  cap: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  latitude: string;
  longitude: string;
}

export default function IntermediaryProfilePage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    name: '',
    vatNumber: '',
    address: '',
    houseNumber: '',
    cap: '',
    city: '',
    province: '',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.intermediaryOrg) {
          const o = data.user.intermediaryOrg;
          setOrg(o);
          setForm({
            name: o.name || '',
            vatNumber: o.vatNumber || '',
            address: o.address || '',
            houseNumber: o.houseNumber || '',
            cap: o.cap || '',
            city: o.city || '',
            province: o.province || '',
            phone: o.phone || '',
            email: o.email || '',
            latitude: o.latitude?.toString() || '',
            longitude: o.longitude?.toString() || '',
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/organization/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          vatNumber: form.vatNumber || null,
          address: form.address || null,
          houseNumber: form.houseNumber || null,
          cap: form.cap || null,
          city: form.city || null,
          province: form.province || null,
          phone: form.phone || null,
          email: form.email || null,
          latitude: form.latitude || null,
          longitude: form.longitude || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore durante il salvataggio');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
    } finally {
      setSaving(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalizzazione non supportata');
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));
        setLocating(false);
        setSuccess(false);
      },
      () => {
        setLocationError('Impossibile ottenere la posizione');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const geocodeAddress = async () => {
    const fullAddress = [form.address, form.houseNumber, form.cap, form.city]
      .filter(Boolean)
      .join(', ');

    if (!fullAddress) {
      setLocationError('Completa l\'indirizzo per calcolare la posizione');
      return;
    }

    setGeocoding(true);
    setLocationError(null);

    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: [form.address, form.houseNumber].filter(Boolean).join(', '),
          city: form.city,
          cap: form.cap || undefined,
          province: form.province || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore nel calcolo della posizione');
      }

      setForm(prev => ({
        ...prev,
        latitude: data.latitude.toString(),
        longitude: data.longitude.toString(),
      }));
      setSuccess(false);
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : 'Errore');
    } finally {
      setGeocoding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Dati organizzazione non trovati.</p>
      </div>
    );
  }

  const hasLocation = form.latitude && form.longitude;

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-medium text-gray-900">Profilo Ente</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          org.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {org.verified ? 'Verificato' : 'In verifica'}
        </span>
      </div>

      {/* Organization Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span>🏢</span> Dati organizzazione
          </h2>

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              ✓ Dati salvati con successo
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ragione sociale *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partita IVA</label>
              <input
                type="text"
                name="vatNumber"
                value={form.vatNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none uppercase"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numero civico</label>
              <input
                type="text"
                name="houseNumber"
                value={form.houseNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
              <input
                type="text"
                name="cap"
                value={form.cap}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Città *</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
              <input
                type="text"
                name="province"
                value={form.province}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
            >
              {saving ? 'Salvataggio...' : 'Salva dati organizzazione'}
            </button>
          </div>
        </div>
      </form>

      {/* Geolocation */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>📍</span> Posizione geografica
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {hasLocation
            ? `Posizione: ${parseFloat(form.latitude).toFixed(5)}, ${parseFloat(form.longitude).toFixed(5)}`
            : 'Nessuna posizione registrata'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            type="button"
            onClick={detectLocation}
            disabled={locating}
            className="flex-1 px-4 py-2.5 bg-secondary-600 text-white text-sm font-medium rounded-lg hover:bg-secondary-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {locating ? (
              <><span className="animate-spin">🔄</span> Rilevamento...</>
            ) : (
              <><span>📡</span> {hasLocation ? 'Aggiorna con GPS' : 'Rileva con GPS'}</>
            )}
          </button>
          <button
            type="button"
            onClick={geocodeAddress}
            disabled={geocoding || !form.address || !form.city}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {geocoding ? (
              <><span className="animate-spin">🔄</span> Calcolo...</>
            ) : (
              <><span>🏠</span> Calcola da indirizzo</>
            )}
          </button>
        </div>

        {locationError && (
          <p className="text-sm text-red-600 mb-4">{locationError}</p>
        )}

        {hasLocation && (
          <div>
            <LocationMap
              latitude={parseFloat(form.latitude)}
              longitude={parseFloat(form.longitude)}
              height="250px"
            />
          </div>
        )}
      </div>

      {/* Password Change */}
      <PasswordChangeForm />
    </div>
  );
}
