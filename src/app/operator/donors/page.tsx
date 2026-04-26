'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface Donor {
  id: string;
  name: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  canProvideServices: boolean;
  canProvideServicesAt: string | null;
  createdAt: string;
  donorProfile: {
    totalDonations: number;
    level: string;
  } | null;
}

export default function DonorsListPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    try {
      const res = await fetch('/api/operator/donors');
      if (res.ok) {
        const data = await res.json();
        setDonors(data.donors);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchDonors} className="text-primary-600 hover:underline">
            Riprova
          </button>
        </div>
      </div>
    );
  }

  const LEVEL_COLORS: Record<string, string> = {
    BRONZE: 'bg-amber-700',
    SILVER: 'bg-gray-400',
    GOLD: 'bg-yellow-500',
    PLATINUM: 'bg-gray-600',
    DIAMOND: 'bg-blue-400',
  };

  const LEVEL_EMOJI: Record<string, string> = {
    BRONZE: '🥉',
    SILVER: '🥈',
    GOLD: '🥇',
    PLATINUM: '🏆',
    DIAMOND: '💎',
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Donatori</h1>
        <p className="text-gray-500 text-sm">Gestisci i donatori che donano al tuo ente</p>
      </div>

      {donors.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <span className="text-5xl mb-4 block">🎁</span>
          <p className="text-gray-500">Nessun donatore presente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {donors.map((donor) => {
            const displayName = donor.firstName && donor.lastName
              ? `${donor.firstName} ${donor.lastName}`
              : donor.name;

            return (
              <div
                key={donor.id}
                className="bg-white p-4 rounded-xl shadow-sm border"
              >
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🎁</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{displayName}</h3>
                        <p className="text-sm text-gray-500 truncate">{donor.email}</p>
                      </div>
                      <Link
                        href={`/operator/donors/${donor.id}`}
                        className="shrink-0 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
                      >
                        Dettagli
                      </Link>
                    </div>

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <span className={`px-2 py-0.5 text-xs font-medium text-white rounded ${LEVEL_COLORS[donor.donorProfile?.level || 'BRONZE']}`}>
                        {LEVEL_EMOJI[donor.donorProfile?.level || 'BRONZE']} {donor.donorProfile?.level || 'BRONZE'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {donor.donorProfile?.totalDonations || 0} donazioni
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded ${donor.canProvideServices ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {donor.canProvideServices ? '✓ Servizi' : 'Solo beni'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 mt-2">
                      Registrato il {formatDate(donor.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}