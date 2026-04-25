'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Recipient {
  id: string;
  name: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fiscalCode: string | null;
  authorized: boolean;
  authorizedAt: string | null;
  createdAt: string;
  isee: string | null;
  _count: {
    requests: number;
  };
}

export default function IntermediaryRecipientsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    try {
      const res = await fetch('/api/intermediary/recipients');
      const data = await res.json();
      setRecipients(data.recipients || []);
      setOrganizationName(data.organizationName || '');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async (recipientId: string, authorize: boolean) => {
    setMessage('');
    try {
      const res = await fetch('/api/intermediary/recipients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, authorize }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Errore');
        return;
      }

      setMessage(authorize ? 'Ricevente autorizzato' : 'Autorizzazione revocata');
      fetchRecipients();
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

  return (
    <div className="max-w-full">
      <h1 className="text-3xl font-medium text-gray-900 mb-2">Gestione Beneficiari</h1>
      <p className="text-gray-500 mb-8">{organizationName}</p>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.includes('autorizzato') || message.includes('revocata') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      {recipients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <span className="text-5xl mb-4 block">👥</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessun ricevente</h2>
          <p className="text-gray-500">Non ci sono riceventi che fanno riferimento al tuo ente.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Nome</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Codice Fiscale</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">ISEE</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Stato</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Richieste</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recipients.map((recipient) => (
                <tr key={recipient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => router.push(`/intermediary/recipients/${recipient.id}`)}
                      className="text-left hover:underline"
                    >
                      <p className="font-medium text-primary-600">{recipient.firstName} {recipient.lastName}</p>
                      <p className="text-sm text-gray-500">{recipient.name}</p>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{recipient.email}</td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-700 uppercase">
                    {recipient.fiscalCode || '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {recipient.isee ? `€${parseFloat(recipient.isee.toString()).toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      recipient.authorized
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {recipient.authorized ? 'Autorizzato' : 'In attesa'}
                    </span>
                    {recipient.authorized && recipient.authorizedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        dal {formatDate(recipient.authorizedAt)}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {recipient._count.requests}
                  </td>
                  <td className="px-6 py-4">
                    {recipient.authorized ? (
                      <button
                        onClick={() => handleAuthorize(recipient.id, false)}
                        className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        Revoca
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAuthorize(recipient.id, true)}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Autorizza
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
