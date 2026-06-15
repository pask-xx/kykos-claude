'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Send, Package } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { CATEGORY_LABELS, CONDITION_LABELS, DONOR_LEVEL_LABELS, Category, Condition, DonorLevel } from '@/types';
import { Avatar, Switch } from '@/components/ui';
import SendMessageDialog from '@/components/SendMessageDialog';

interface DonorStats {
  totalDonations: number;
  totalObjects: number;
  totalServiceOffers: number;
  categoryBreakdown: Record<string, { count: number; percentage: number }>;
  conditionBreakdown: Record<string, { count: number; percentage: number }>;
  donatedCategories: Record<string, number>;
  recentDonations: {
    id: string;
    objectTitle: string;
    category: string;
    condition: string;
    imageUrl: string | null;
    receivedAt: string;
  }[];
}

interface Donor {
  id: string;
  nickname: string | null;
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
  profileImageUrl: string | null;
  donorProfile: {
    totalDonations: number;
    totalObjects: number;
    level: string;
  } | null;
}

const CATEGORY_COLORS: Record<Category, string> = {
  FURNITURE: 'bg-warning-500',
  ELECTRONICS: 'bg-info-500',
  CLOTHING: 'bg-pink-500',
  BOOKS: 'bg-success-500',
  KITCHEN: 'bg-orange-500',
  SPORTS: 'bg-teal-500',
  TOYS: 'bg-secondary-500',
  OTHER: 'bg-gray-500',
};

const CONDITION_COLORS: Record<Condition, string> = {
  NEW: 'bg-success-500',
  LIKE_NEW: 'bg-teal-500',
  GOOD: 'bg-info-500',
  FAIR: 'bg-yellow-500',
  POOR: 'bg-error-500',
};

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
          <p className="text-error-600 mb-4">{error || 'Donatore non trovato'}</p>
          <Link href="/operator/donors" className="text-primary-600 hover:underline">
            ← Torna alla lista
          </Link>
        </div>
      </div>
    );
  }

  const displayName = donor.nickname || donor.name;
  const donorLevel = (donor.donorProfile?.level || 'BRONZE') as DonorLevel;

  return (
    <div className="space-y-6 p-4 sm:p-6 overflow-x-hidden">
      {/* Header: Avatar a sx, nickname + nome + email a dx, button Messaggio in alto a destra */}
      <div>
        <Link href="/operator/donors" className="text-sm text-gray-500 hover:text-primary-600 mb-2 inline-flex items-center gap-1">
          ← Torna alla lista
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Avatar
              src={donor.profileImageUrl}
              name={displayName || '?'}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 truncate">{displayName}</h1>
                <span className="px-2 py-0.5 text-xs font-medium text-white rounded bg-warning-700">
                  {DONOR_LEVEL_LABELS[donorLevel]}
                </span>
              </div>
              {donor.firstName && donor.lastName && (
                <p className="text-gray-500 truncate">{donor.firstName} {donor.lastName}</p>
              )}
              <p className="text-gray-500 truncate">{donor.email}</p>
            </div>
          </div>
          <SendMessageDialog userId={donor.id} userType="USER" userName={displayName}>
            <button className="w-full sm:w-auto px-4 py-2 bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-lg font-medium text-sm inline-flex items-center justify-center gap-1.5">
              <Send className="w-4 h-4" aria-hidden="true" />
              Messaggio
            </button>
          </SendMessageDialog>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error-50 border border-error-200 text-error-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Service Provider Permission */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Permessi servizi</h2>
        <div className="p-3 bg-gray-50 rounded-lg">
          <Switch
            checked={donor.canProvideServices}
            onChange={toggleCanProvideServices}
            label="Fornitore di servizi"
            description="Può soddisfare richieste di servizi"
            loading={updating}
          />
        </div>
        {donor.canProvideServicesAt && (
          <p className="text-xs text-gray-500 mt-2">
            Abilitato il {formatDate(donor.canProvideServicesAt)}
          </p>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informazioni</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {donor.fiscalCode && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Codice Fiscale</p>
              <p className="font-medium text-gray-900 break-all">{donor.fiscalCode}</p>
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
              <p className="font-medium text-gray-900 break-words">
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
          <p className="mt-2 text-xs text-gray-500">a questo ente</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Oggetti donati</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalObjects || 0}</p>
          <p className="mt-2 text-xs text-gray-500">a questo ente</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Offerte servizi</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalServiceOffers || 0}</p>
          <p className="mt-2 text-xs text-gray-500">a questo ente</p>
        </div>
      </div>

      {/* Charts Row: Categorie donate + Condizione oggetti */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorie donate</h2>
          {stats && stats.totalDonations > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.categoryBreakdown)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([cat, data]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{CATEGORY_LABELS[cat as Category] || cat}</span>
                      <span className="text-gray-500">{data.count} ({data.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${CATEGORY_COLORS[cat as Category] || 'bg-gray-500'} rounded-full`}
                        style={{ width: `${data.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nessuna donazione effettuata</p>
          )}
        </div>

        {/* Condition Breakdown */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Condizione oggetti donati</h2>
          {stats && stats.totalDonations > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.conditionBreakdown)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([cond, data]) => (
                  <div key={cond}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{CONDITION_LABELS[cond as Condition] || cond}</span>
                      <span className="text-gray-500">{data.count} ({data.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${CONDITION_COLORS[cond as Condition] || 'bg-gray-500'} rounded-full`}
                        style={{ width: `${data.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nessuna donazione effettuata</p>
          )}
        </div>
      </div>

      {/* Categorie donate (chips) */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cosa ha donato</h2>
        {stats && Object.keys(stats.donatedCategories).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.donatedCategories)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => (
                <span
                  key={cat}
                  className={`px-3 py-1 rounded-full text-sm text-white ${CATEGORY_COLORS[cat as Category] || 'bg-gray-500'}`}
                >
                  {CATEGORY_LABELS[cat as Category] || cat}: {count}
                </span>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Nessuna donazione effettuata</p>
        )}
      </div>

      {/* Recent Donations */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Donazioni recenti</h2>
        {stats && stats.recentDonations.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.recentDonations.map((donation) => (
              <div key={donation.id} className="flex gap-3 p-2.5 border border-gray-100 rounded-lg">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {donation.imageUrl ? (
                    <img src={donation.imageUrl} alt={donation.objectTitle} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" aria-hidden="true" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm leading-snug line-clamp-2">{donation.objectTitle}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {CATEGORY_LABELS[donation.category as Category] || donation.category}
                  </p>
                  <p className="text-xs text-gray-400">
                    {CONDITION_LABELS[donation.condition as Condition] || donation.condition}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(donation.receivedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Nessuna donazione effettuata</p>
        )}
      </div>
    </div>
  );
}
