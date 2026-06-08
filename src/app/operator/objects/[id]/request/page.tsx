'use client';

import { useState, useEffect, use, useId } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/types';

interface ObjectDetail {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  status: string;
  imageUrls: string[];
  depositLocation: string | null;
  donor: { id: string; nickname: string | null; name: string };
  intermediary: { id: string; name: string };
}

interface Recipient {
  id: string;
  nickname: string | null;
  firstName: string | null;
  lastName: string | null;
  fiscalCode: string | null;
  birthDate: string | null;
  city: string | null;
  province: string | null;
  isStreetManaged: boolean;
  referenceEntity: {
    id: string;
    name: string;
    city: string | null;
  } | null;
}

export default function RequestObjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [object, setObject] = useState<ObjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const messageId = useId();

  useEffect(() => {
    fetchObject();
  }, [id]);

  useEffect(() => {
    // Debounced search
    const timer = setTimeout(() => {
      if (search.length >= 2) {
        searchRecipients();
      } else {
        setRecipients([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchObject = async () => {
    try {
      const res = await fetch(`/api/operator/objects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setObject(data.object);
      } else {
        setError('Oggetto non trovato');
      }
    } catch (err) {
      setError('Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  const searchRecipients = async () => {
    setSearching(true);
    try {
      const res = await fetch(`/api/operator/recipients?q=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setRecipients(data.recipients || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedRecipient) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/operator/request-object', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectId: id,
          recipientId: selectedRecipient.id,
          message: message || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore nella richiesta');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/operator/diocese-objects');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore generico');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!object) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{error || 'Oggetto non trovato'}</p>
        <Link href="/operator/diocese-objects" className="text-primary-600 hover:underline mt-2 inline-block">
          ← Torna alla lista
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Richiesta effettuata!</h2>
        <p className="text-gray-500 mb-4">La richiesta è stata creata e approvata automaticamente.</p>
        <p className="text-sm text-gray-400">Reindirizzamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/operator/diocese-objects" className="text-sm text-gray-500 hover:text-primary-600 mb-2 inline-flex items-center gap-1">
          ← Torna alla lista
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Richiedi oggetto</h1>
      </div>

      {/* Object Summary */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex gap-4">
          <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
            {object.imageUrls && object.imageUrls.length > 0 ? (
              <img src={object.imageUrls[0]} alt={object.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">📦</span>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{object.title}</h2>
            <p className="text-sm text-gray-500">
              {CATEGORY_LABELS[object.category as keyof typeof CATEGORY_LABELS] || object.category}
              {' • '}
              {CONDITION_LABELS[object.condition as keyof typeof CONDITION_LABELS] || object.condition}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Ente: {object.intermediary.name}
            </p>
          </div>
        </div>
      </div>

      {/* Search Recipient */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="font-semibold text-gray-900 mb-4">Seleziona beneficiario</h3>

        <input
          type="text"
          placeholder="Cerca per nome, cognome, codice fiscale o nickname..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />

        {searching && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        )}

        {recipients.length > 0 && (
          <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
            {recipients.map((recipient) => (
              <div
                key={recipient.id}
                onClick={() => setSelectedRecipient(recipient)}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  selectedRecipient?.id === recipient.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {recipient.nickname || `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {recipient.firstName} {recipient.lastName}
                      {recipient.fiscalCode && ` • ${recipient.fiscalCode}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {recipient.city && `${recipient.city}`}
                      {recipient.referenceEntity && ` • ${recipient.referenceEntity.name}`}
                      {recipient.isStreetManaged && <span className="ml-2 text-amber-600">Street</span>}
                    </p>
                  </div>
                  {selectedRecipient?.id === recipient.id && (
                    <span className="text-primary-600">✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {search.length >= 2 && !searching && recipients.length === 0 && (
          <p className="text-center text-gray-500 py-4">Nessun beneficiario trovato</p>
        )}
      </div>

      {/* Selected Recipient & Message */}
      {selectedRecipient && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Beneficiario selezionato</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="font-medium text-green-800">
              {selectedRecipient.nickname || `${selectedRecipient.firstName} ${selectedRecipient.lastName}`}
            </p>
            <p className="text-sm text-green-600">
              {selectedRecipient.firstName} {selectedRecipient.lastName}
              {selectedRecipient.city && ` • ${selectedRecipient.city}`}
            </p>
            {selectedRecipient.referenceEntity && (
              <p className="text-xs text-green-500 mt-1">Ente: {selectedRecipient.referenceEntity.name}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor={messageId} className="block text-sm font-medium text-gray-700 mb-1">
              Messaggio (opzionale)
            </label>
            <textarea
              id={messageId}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Aggiungi una nota per questa richiesta..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Invio in corso...
              </span>
            ) : (
              'Conferma richiesta'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
