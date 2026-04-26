'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface Recipient {
  id: string;
  name: string;
  email: string;
  authorized: boolean;
  authorizedAt: string | null;
  createdAt: string;
  isee: string | null;
}

export default function OperatorRecipientsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    try {
      const res = await fetch('/api/operator/recipients');
      const data = await res.json();
      setRecipients(data.recipients || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async (recipientId: string, authorize: boolean) => {
    setProcessing(recipientId);
    try {
      const res = await fetch('/api/operator/recipients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, authorize }),
      });

      if (res.ok) {
        fetchRecipients();
      } else {
        const data = await res.json();
        alert(data.error || 'Errore');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Errore di connessione');
    } finally {
      setProcessing(null);
    }
  };

  const pendingRecipients = recipients.filter(r => !r.authorized);
  const authorizedRecipients = recipients.filter(r => r.authorized);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestione beneficiari</h1>
        <p className="text-gray-500">Autorizza o revoca l&apos;accesso ai beneficiari</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Caricamento...</p>
        </div>
      ) : recipients.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
          <span className="text-5xl mb-4 block">👥</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessun beneficiario</h2>
          <p className="text-gray-500">Non ci sono beneficiari associati a questo ente.</p>
        </div>
      ) : (
        <>
          {/* Pending Recipients */}
          {pendingRecipients.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                ⏳ In attesa ({pendingRecipients.length})
              </h2>
              <div className="space-y-4">
                {pendingRecipients.map((recipient) => (
                  <div key={recipient.id} className="bg-white p-4 rounded-xl shadow-sm border-2 border-amber-200">
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">👤</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link href={`/operator/recipients/${recipient.id}`} className="font-semibold text-gray-900 hover:text-primary-600">
                              {recipient.name}
                            </Link>
                            <p className="text-sm text-gray-500 truncate">{recipient.email}</p>
                          </div>
                        </div>

                        {recipient.isee && (
                          <p className="text-sm text-gray-500 mt-1">
                            ISEE: €{recipient.isee}
                          </p>
                        )}

                        <p className="text-xs text-gray-400 mt-2">
                          Registrato il {formatDate(recipient.createdAt)}
                        </p>

                        <div className="mt-3">
                          <button
                            onClick={() => handleAuthorize(recipient.id, true)}
                            disabled={processing === recipient.id}
                            className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50"
                          >
                            {processing === recipient.id ? 'Elaborazione...' : '✓ Autorizza'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Authorized Recipients */}
          {authorizedRecipients.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                ✓ Autorizzati ({authorizedRecipients.length})
              </h2>
              <div className="space-y-4">
                {authorizedRecipients.map((recipient) => (
                  <div key={recipient.id} className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">👤</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link href={`/operator/recipients/${recipient.id}`} className="font-semibold text-gray-900 hover:text-primary-600">
                              {recipient.name}
                            </Link>
                            <p className="text-sm text-gray-500 truncate">{recipient.email}</p>
                          </div>
                          <Link
                            href={`/operator/recipients/${recipient.id}`}
                            className="shrink-0 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
                          >
                            Gestisci
                          </Link>
                        </div>

                        <p className="text-xs text-gray-400 mt-2">
                          Autorizzato il {formatDate(recipient.authorizedAt!)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}