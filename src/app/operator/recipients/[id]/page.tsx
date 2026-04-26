'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { CATEGORY_LABELS, CONDITION_LABELS, Category, Condition } from '@/types';

interface RecipientStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  expiredRequests: number;
  totalDonations: number;
  categoryBreakdown: Record<string, { count: number; percentage: number }>;
  conditionBreakdown: Record<string, { count: number; percentage: number }>;
  requestedCategories: Record<string, number>;
  recentDonations: {
    id: string;
    objectTitle: string;
    category: string;
    condition: string;
    imageUrl: string | null;
    receivedAt: string;
  }[];
}

interface Recipient {
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
  isee: string | null;
  authorized: boolean;
  authorizedAt: string | null;
  canRequestGoods: boolean;
  canRequestServices: boolean;
  createdAt: string;
}

const CATEGORY_COLORS: Record<Category, string> = {
  FURNITURE: 'bg-amber-500',
  ELECTRONICS: 'bg-blue-500',
  CLOTHING: 'bg-pink-500',
  BOOKS: 'bg-green-500',
  KITCHEN: 'bg-orange-500',
  SPORTS: 'bg-teal-500',
  TOYS: 'bg-purple-500',
  OTHER: 'bg-gray-500',
};

const CONDITION_COLORS: Record<Condition, string> = {
  NEW: 'bg-green-500',
  LIKE_NEW: 'bg-teal-500',
  GOOD: 'bg-blue-500',
  FAIR: 'bg-yellow-500',
  POOR: 'bg-red-500',
};

export default function RecipientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [stats, setStats] = useState<RecipientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecipient();
  }, [id]);

  const fetchRecipient = async () => {
    try {
      const res = await fetch(`/api/operator/recipients/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRecipient(data.recipient);
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

  const toggleAuthorized = async () => {
    if (!recipient) return;
    setUpdating(true);
    setError(null);

    try {
      const res = await fetch(`/api/operator/recipients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorized: !recipient.authorized }),
      });

      if (res.ok) {
        setRecipient(prev => prev ? { ...prev, authorized: !prev.authorized } : null);
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

  const toggleRequestPermission = async (field: 'canRequestGoods' | 'canRequestServices') => {
    if (!recipient) return;
    setUpdating(true);
    setError(null);

    try {
      const res = await fetch(`/api/operator/recipients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !recipient[field] }),
      });

      if (res.ok) {
        setRecipient(prev => prev ? { ...prev, [field]: !prev[field] } : null);
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

  if (!recipient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Beneficiario non trovato'}</p>
          <Link href="/operator/recipients" className="text-primary-600 hover:underline">
            ← Torna alla lista
          </Link>
        </div>
      </div>
    );
  }

  const displayName = recipient.firstName && recipient.lastName
    ? `${recipient.firstName} ${recipient.lastName}`
    : recipient.name;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/operator/recipients" className="text-sm text-gray-500 hover:text-primary-600 mb-2 inline-flex items-center gap-1">
            ← Torna alla lista
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
          <p className="text-gray-500">{recipient.email}</p>
        </div>
        <button
          onClick={toggleAuthorized}
          disabled={updating}
          className={`px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 ${
            recipient.authorized
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {updating ? 'Aggiornamento...' : recipient.authorized ? 'Disattiva' : 'Attiva'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Status Badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
        recipient.authorized
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-500'
      }`}>
        <span className={`w-2 h-2 rounded-full ${recipient.authorized ? 'bg-green-500' : 'bg-gray-400'}`} />
        {recipient.authorized ? 'Attivo' : 'Disattivato'}
      </div>

      {/* Permissions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Permessi richieste</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">🪑 Richiesta beni</p>
              <p className="text-sm text-gray-500">Può richiedere beni all&apos;ente</p>
            </div>
            <button
              onClick={() => toggleRequestPermission('canRequestGoods')}
              disabled={updating}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                recipient.canRequestGoods ? 'bg-green-500' : 'bg-gray-300'
              } disabled:opacity-50`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  recipient.canRequestGoods ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">🔧 Richiesta servizi</p>
              <p className="text-sm text-gray-500">Può richiedere servizi all&apos;ente</p>
            </div>
            <button
              onClick={() => toggleRequestPermission('canRequestServices')}
              disabled={updating}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                recipient.canRequestServices ? 'bg-green-500' : 'bg-gray-300'
              } disabled:opacity-50`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  recipient.canRequestServices ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informazioni</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipient.fiscalCode && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Codice Fiscale</p>
              <p className="font-medium text-gray-900">{recipient.fiscalCode}</p>
            </div>
          )}
          {recipient.birthDate && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Data di nascita</p>
              <p className="font-medium text-gray-900">{formatDate(recipient.birthDate)}</p>
            </div>
          )}
          {recipient.isee && (
            <div>
              <p className="text-xs text-gray-500 uppercase">ISEE</p>
              <p className="font-medium text-gray-900">€{recipient.isee}</p>
            </div>
          )}
          {recipient.address && (
            <div className="md:col-span-2">
              <p className="text-xs text-gray-500 uppercase">Indirizzo</p>
              <p className="font-medium text-gray-900">
                {recipient.address}{recipient.houseNumber ? `, ${recipient.houseNumber}` : ''}
                {recipient.cap ? ` - ${recipient.cap}` : ''}
                {recipient.city ? ` ${recipient.city}` : ''}
                {recipient.province ? ` (${recipient.province})` : ''}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 uppercase">Registrato il</p>
            <p className="font-medium text-gray-900">{formatDate(recipient.createdAt)}</p>
          </div>
          {recipient.authorizedAt && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Autorizzato il</p>
              <p className="font-medium text-gray-900">{formatDate(recipient.authorizedAt)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Richieste totali</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalRequests || 0}</p>
          <div className="mt-2 flex gap-2 text-xs">
            <span className="text-amber-600">{stats?.pendingRequests || 0} in attesa</span>
            <span className="text-green-600">{stats?.approvedRequests || 0} approvate</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Donazioni ricevute</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalDonations || 0}</p>
          <div className="mt-2 flex gap-2 text-xs">
            <span className="text-red-600">{stats?.rejectedRequests || 0} rifiutate</span>
            <span className="text-gray-400">{stats?.expiredRequests || 0} scadute</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Tasso di approvazione</p>
          <p className="text-3xl font-bold text-gray-900">
            {stats && stats.totalRequests > 0
              ? Math.round((stats.approvedRequests / stats.totalRequests) * 100)
              : 0}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Oggetti richiesti</p>
          <p className="text-3xl font-bold text-gray-900">
            {Object.values(stats?.requestedCategories || {}).reduce((a, b) => a + b, 0)}
          </p>
          <p className="mt-2 text-xs text-gray-500">tra tutte le categorie</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorie ricevute</h2>
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
            <p className="text-gray-500 text-sm">Nessuna donazione ricevuta</p>
          )}
        </div>

        {/* Condition Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Condizione oggetti ricevuti</h2>
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
            <p className="text-gray-500 text-sm">Nessuna donazione ricevuta</p>
          )}
        </div>
      </div>

      {/* Categorie richieste */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cosa ha richiesto</h2>
        {stats && Object.keys(stats.requestedCategories).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.requestedCategories)
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
          <p className="text-gray-500 text-sm">Nessuna richiesta effettuata</p>
        )}
      </div>

      {/* Recent Donations */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Donazioni recenti</h2>
        {stats && stats.recentDonations.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recentDonations.map((donation) => (
              <div key={donation.id} className="flex gap-3 p-3 border border-gray-100 rounded-lg">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {donation.imageUrl ? (
                    <img src={donation.imageUrl} alt={donation.objectTitle} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{donation.objectTitle}</p>
                  <p className="text-xs text-gray-500">
                    {CATEGORY_LABELS[donation.category as Category] || donation.category}
                  </p>
                  <p className="text-xs text-gray-400">
                    {CONDITION_LABELS[donation.condition as Condition] || donation.condition}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(donation.receivedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Nessuna donazione ricevuta</p>
        )}
      </div>
    </div>
  );
}
