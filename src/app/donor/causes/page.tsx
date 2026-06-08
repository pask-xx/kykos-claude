'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

interface Cause {
  id: string;
  title: string;
  description: string;
  imageUrls: string[];
  targetQty: number | null;
  deadline: string | null;
  organization: { id: string; name: string; city: string | null };
  participantCount: number;
  hasJoined: boolean;
}

export default function DonorCausesPage() {
  const [causes, setCauses] = useState<Cause[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    fetchCauses();
  }, []);

  const fetchCauses = async () => {
    try {
      const res = await fetch('/api/causes');
      if (res.ok) {
        const data = await res.json();
        setCauses(data.causes);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (causeId: string) => {
    setJoiningId(causeId);
    try {
      const res = await fetch(`/api/causes/${causeId}/join`, { method: 'POST' });
      if (res.ok) {
        fetchCauses();
      } else {
        const data = await res.json();
        toast.error(data?.error || 'Errore');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Errore di connessione');
    } finally {
      setJoiningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cause</h1>
        <p className="text-gray-500">Partecipa alle cause di raccolta fondi</p>
      </div>

      {causes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">
          Nessuna causa disponibile al momento
        </div>
      ) : (
        <div className="grid gap-4">
          {causes.map((cause) => (
            <div key={cause.id} className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex gap-4">
                {cause.imageUrls && cause.imageUrls.length > 0 && (
                  <img
                    src={cause.imageUrls[0]}
                    alt={cause.title}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">{cause.title}</h2>
                  <p className="text-sm text-gray-500">{cause.organization.name}</p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{cause.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                    <span>{cause.participantCount} partecipanti</span>
                    {cause.targetQty && <span>Target: {cause.targetQty}</span>}
                    {cause.deadline && <span>Scade: {formatDate(cause.deadline)}</span>}
                  </div>
                </div>
                <div className="flex items-center">
                  {cause.hasJoined ? (
                    <span className="px-4 py-2 bg-success-100 text-success-700 rounded-lg font-medium inline-flex items-center gap-1">
                      <Check className="w-4 h-4" aria-hidden="true" />
                      Iscritto
                    </span>
                  ) : (
                    <button
                      onClick={() => handleJoin(cause.id)}
                      disabled={joiningId === cause.id}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
                    >
                      {joiningId === cause.id ? 'Iscrizione...' : 'Aderisci'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
