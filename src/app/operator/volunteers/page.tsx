'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Volunteer {
  id: string;
  userId: string;
  profile: string | null;
  status: string;
  startDate: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    city: string | null;
  };
}

export default function OperatorVolunteersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Volunteer[]>([]);
  const [approved, setApproved] = useState<Volunteer[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    try {
      const res = await fetch('/api/operator/volunteers');
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore nel caricamento');
        return;
      }

      setPending(data.pending || []);
      setApproved(data.approved || []);
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (volunteerId: string, action: 'approve' | 'reject' | 'suspend') => {
    setActionLoading(volunteerId);
    setError(null);

    try {
      const res = await fetch(`/api/operator/volunteers/${volunteerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh lists
        if (action === 'approve') {
          const volunteer = pending.find(v => v.id === volunteerId);
          setPending(prev => prev.filter(v => v.id !== volunteerId));
          if (volunteer) {
            setApproved(prev => [{
              ...volunteer,
              status: 'APPROVED',
              startDate: new Date().toISOString(),
            }, ...prev]);
          }
        } else if (action === 'reject') {
          setPending(prev => prev.filter(v => v.id !== volunteerId));
        }
      } else {
        setError(data.error || 'Errore durante l\'azione');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/operator/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Torna alla dashboard
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">🤝</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Volontari</h1>
          <p className="text-gray-600">Revisiona e gestisci le candidature dei volontari</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Pending Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Candidature pendenti
          {pending.length > 0 && (
            <span className="ml-2 bg-amber-100 text-amber-700 text-sm px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </h2>

        {pending.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">✅</div>
            <p>Nessuna candidatura pendente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map(volunteer => (
              <div key={volunteer.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{volunteer.user.name}</p>
                    <p className="text-sm text-gray-500">{volunteer.user.email}</p>
                    {volunteer.user.city && (
                      <p className="text-sm text-gray-400">{volunteer.user.city}</p>
                    )}
                    {volunteer.profile && (
                      <p className="text-sm text-primary-600 mt-1">
                        Profilo: {volunteer.profile}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Candidatura del {formatDate(volunteer.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(volunteer.id, 'approve')}
                      disabled={actionLoading === volunteer.id}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === volunteer.id ? '...' : 'Approva'}
                    </button>
                    <button
                      onClick={() => handleAction(volunteer.id, 'reject')}
                      disabled={actionLoading === volunteer.id}
                      className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {actionLoading === volunteer.id ? '...' : 'Rifiuta'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Volontari attivi
          {approved.length > 0 && (
            <span className="ml-2 bg-green-100 text-green-700 text-sm px-2 py-0.5 rounded-full">
              {approved.length}
            </span>
          )}
        </h2>

        {approved.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🤝</div>
            <p>Nessun volontario attivo</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approved.map(volunteer => (
              <div key={volunteer.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{volunteer.user.name}</p>
                    <p className="text-sm text-gray-500">{volunteer.user.email}</p>
                    {volunteer.profile && (
                      <p className="text-sm text-primary-600 mt-1">
                        Profilo: {volunteer.profile}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Attivo dal {formatDate(volunteer.startDate)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAction(volunteer.id, 'suspend')}
                    disabled={actionLoading === volunteer.id}
                    className="px-3 py-1.5 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 disabled:opacity-50"
                  >
                    {actionLoading === volunteer.id ? '...' : 'Sospendi'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}