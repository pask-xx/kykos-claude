'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import dynamic from 'next/dynamic';

const LocationMap = dynamic(() => import('@/components/map/LocationMap'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center"><span className="text-gray-400">Caricamento mappa...</span></div>,
});

interface Beneficiary {
  id: string;
  name: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fiscalCode: string | null;
  birthDate: string | null;
  address: string | null;
  houseNumber: string | null;
  cap: string | null;
  city: string | null;
  province: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  authorized: boolean;
  authorizedAt: string | null;
  createdAt: string;
  isee: string | null;
  _count: {
    requests: number;
  };
}

export default function BeneficiaryDetailPage() {
  const params = useParams();
  const beneficiaryId = params.id as string;
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchBeneficiary();
  }, [beneficiaryId]);

  const fetchBeneficiary = async () => {
    try {
      const res = await fetch(`/api/intermediary/recipients/${beneficiaryId}`);
      const data = await res.json();
      if (res.ok) {
        setBeneficiary(data.recipient);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async (authorize: boolean) => {
    setMessage('');
    try {
      const res = await fetch('/api/intermediary/recipients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: beneficiaryId, authorize }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Errore');
        return;
      }

      setMessage(authorize ? 'Beneficiario autorizzato' : 'Autorizzazione revocata');
      fetchBeneficiary();
    } catch {
      setMessage('Errore di connessione');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!beneficiary) {
    return (
      <div className="max-w-full">
        <p className="text-gray-500">Beneficiario non trovato.</p>
      </div>
    );
  }

  return (
    <div className="max-w-full">
      <div className="mb-6">
        <Link href="/intermediary/recipients" className="text-primary-600 hover:text-primary-700 text-sm">
          ← Torna alla lista
        </Link>
      </div>

      <h1 className="text-3xl font-medium text-gray-900 mb-2">
        {beneficiary.firstName} {beneficiary.lastName}
      </h1>
      <p className="text-gray-500 mb-8">{beneficiary.email}</p>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.includes('autorizzato') || message.includes('revocata') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Status Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              beneficiary.authorized ? 'bg-green-100' : 'bg-amber-100'
            }`}>
              <span className="text-2xl">{beneficiary.authorized ? '✅' : '⏳'}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {beneficiary.authorized ? 'Autorizzato' : 'In attesa di autorizzazione'}
              </p>
              {beneficiary.authorized && beneficiary.authorizedAt && (
                <p className="text-sm text-gray-500">
                  dal {formatDate(beneficiary.authorizedAt)}
                </p>
              )}
            </div>
          </div>
          {beneficiary.authorized ? (
            <button
              onClick={() => handleAuthorize(false)}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Revoca autorizzazione
            </button>
          ) : (
            <button
              onClick={() => handleAuthorize(true)}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Autorizza
            </button>
          )}
        </div>
      </div>

      {/* Personal Data */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>👤</span> Dati anagrafici
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Nome completo</p>
            <p className="font-medium text-gray-900">{beneficiary.firstName} {beneficiary.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Email</p>
            <p className="font-medium text-gray-900">{beneficiary.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Codice Fiscale</p>
            <p className="font-medium text-gray-900 uppercase font-mono">{beneficiary.fiscalCode || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Data di nascita</p>
            <p className="font-medium text-gray-900">
              {beneficiary.birthDate ? formatDate(beneficiary.birthDate) : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Telefono</p>
            <p className="font-medium text-gray-900">—</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Valore ISEE</p>
            <p className="font-medium text-gray-900">
              {beneficiary.isee ? `€${parseFloat(beneficiary.isee.toString()).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
            </p>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <p className="text-sm text-gray-500 mb-1">Indirizzo</p>
            <p className="font-medium text-gray-900">
              {beneficiary.address ? `${beneficiary.address}, ${beneficiary.houseNumber || ''}` : '—'}
              {beneficiary.cap ? ` - ${beneficiary.cap} ${beneficiary.city || ''}` : ''}
              {beneficiary.province ? ` (${beneficiary.province})` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>📊</span>Statistiche
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Richieste effettuate</p>
            <p className="text-2xl font-bold text-gray-900">{beneficiary._count.requests}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Data registrazione</p>
            <p className="font-medium text-gray-900">{formatDate(beneficiary.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Geolocation */}
      {beneficiary.latitude && beneficiary.longitude && (
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📍</span> Posizione geografica
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {beneficiary.latitude.toFixed(5)}, {beneficiary.longitude.toFixed(5)}
          </p>
          <LocationMap
            latitude={beneficiary.latitude}
            longitude={beneficiary.longitude}
            height="300px"
          />
        </div>
      )}
    </div>
  );
}
