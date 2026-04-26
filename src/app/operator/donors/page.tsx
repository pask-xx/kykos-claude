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

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Donatori</h1>
          <p className="text-gray-500 text-sm">Gestisci i donatori che donano al tuo ente</p>
        </div>
      </div>

      {donors.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <p className="text-gray-500">Nessun donatore presente</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Donatore
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Livello
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Servizi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Donazioni
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registrato
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {donors.map((donor) => {
                const displayName = donor.firstName && donor.lastName
                  ? `${donor.firstName} ${donor.lastName}`
                  : donor.name;

                return (
                  <tr key={donor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-lg">🎁</span>
                        </div>
                        <div className="ml-4">
                          <p className="font-medium text-gray-900">{displayName}</p>
                          <p className="text-sm text-gray-500">{donor.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium text-white rounded ${
                        LEVEL_COLORS[donor.donorProfile?.level || 'BRONZE'] || 'bg-gray-400'
                      }`}>
                        {donor.donorProfile?.level || 'BRONZE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        donor.canProvideServices
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {donor.canProvideServices ? 'Abilitato' : 'Non abilitato'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {donor.donorProfile?.totalDonations || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(donor.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/operator/donors/${donor.id}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Dettagli →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
