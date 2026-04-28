'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import SendMessageDialog from '@/components/SendMessageDialog';

interface DonorStats {
  totalDonations: number;
  totalObjects: number;
  totalServiceOffers: number;
}

interface Donor {
  id: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  fiscalCode: string | null;
  birthDate: string | null;
  address: string | null;
  houseNumber: string | null;
  cap: string | null;
  city: string | null;
  province: string | null;
  canProvideServices: boolean;
  canProvideServicesAt: string | null;
  createdAt: string;
  donorProfile: {
    totalDonations: number;
    totalObjects: number;
    level: string;
  } | null;
}

export default function DonorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [donor, setDonor] = useState<Donor | null>(null);
  const [stats, setStats] = useState<DonorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDonor();
  }, [id]);

  const fetchDonor = async () => {
    try {
      const res = await fetch(`/api/operator/donors/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDonor(data.donor);
        setStats(data.stats);
      } else {
        const err = await res.json();
        setError(err.error || 'Errore');
      }
    } catch (err) {
      setError('Errore di rete');
    } finally {
      setLoading(false);
    }
  };

  const toggleCanProvideServices = async () => {
    if (!donor) return;
    setUpdating(true);
    setError(null);

    try {
      const res = await fetch(`/api/operator/donors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canProvideServices: !donor.canProvideServices }),
      });

      if (res.ok) {
        setDonor(prev => prev ? {
          ...prev,
          canProvideServices: !prev.canProvideServices,
          canProvideServicesAt: !prev.canProvideServices ? new Date().toISOString() : null,
        } : null);
      } else {
        const err = await res.json();
        setError(err.error || 'Errore');
      }
    } catch (err) {
      setError('Errore di rete');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Donatore non trovato'}</p>
          <Link href="/operator/donors" className="text-primary-600 hover:underline">
            ← Torna alla lista
          </Link>
        </div>
      </div>
    );
  }

  const displayName = donor.firstName && donor.lastName
    ? `${donor.firstName} ${donor.lastName}`
    : donor.name;

  const LEVEL_COLORS: Record<string, string> = {
    BRONZE: 'bg-amber-700',
    SILVER: 'bg-gray-400',
    GOLD: 'bg-yellow-500',
    PLATINUM: 'bg-gray-600',
    DIAMOND: 'bg-blue-400',
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/operator/donors" className="text-sm text-gray-500 hover:text-primary-600 mb-2 inline-flex items-center gap-1">
            ← Torna alla lista
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
          <p className="text-gray-500">{donor.email}</p>
        </div>
        <span className={`px-3 py-1 text-sm font-medium text-white rounded ${
          LEVEL_COLORS[donor.donorProfile?.level || 'BRONZE'] || 'bg-gray-400'
        }`}>
          {donor.donorProfile?.level || 'BRONZE'}
        </span>
        <SendMessageDialog userId={donor.id} userType="USER" userName={displayName}>
          <button className="px-4 py-2 bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-lg font-medium text-sm">
            📩 Messaggio
          </button>
        </SendMessageDialog>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Service Provider Permission */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Permessi servizi</h2>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">🔧 Fornitore di servizi</p>
            <p className="text-sm text-gray-500">Può soddisfare richieste di servizi</p>
          </div>
          <button
            onClick={toggleCanProvideServices}
            disabled={updating}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              donor.canProvideServices ? 'bg-green-500' : 'bg-gray-300'
            } disabled:opacity-50`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                donor.canProvideServices ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {donor.canProvideServicesAt && (
          <p className="text-xs text-gray-500 mt-2">
            Abilitato il {formatDate(donor.canProvideServicesAt)}
          </p>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informazioni</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {donor.fiscalCode && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Codice Fiscale</p>
              <p className="font-medium text-gray-900">{donor.fiscalCode}</p>
            </div>
          )}
          {donor.birthDate && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Data di nascita</p>
              <p className="font-medium text-gray-900">{formatDate(donor.birthDate)}</p>
            </div>
          )}
          {donor.address && (
            <div className="md:col-span-2">
              <p className="text-xs text-gray-500 uppercase">Indirizzo</p>
              <p className="font-medium text-gray-900">
                {donor.address}{donor.houseNumber ? `, ${donor.houseNumber}` : ''}
                {donor.cap ? ` - ${donor.cap}` : ''}
                {donor.city ? ` ${donor.city}` : ''}
                {donor.province ? ` (${donor.province})` : ''}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 uppercase">Registrato il</p>
            <p className="font-medium text-gray-900">{formatDate(donor.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Donazioni totali</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalDonations || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Oggetti donati</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalObjects || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Offerte servizi</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalServiceOffers || 0}</p>
        </div>
      </div>
    </div>
  );
}
