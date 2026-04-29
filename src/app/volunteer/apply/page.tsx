'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  city: string;
  province: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number;
}

const PROFILES = [
  { value: '', label: 'Seleziona profilo...' },
  { value: 'Distribuzione', label: 'Distribuzione' },
  { value: 'Assistenza', label: 'Assistenza' },
  { value: 'Amministrativo', label: 'Amministrativo' },
  { value: 'Animazione', label: 'Animazione' },
  { value: 'Trasporto', label: 'Trasporto' },
  { value: 'Altro', label: 'Altro' },
];

export default function VolunteerApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [profile, setProfile] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [cvUrl, setCvUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [noLocation, setNoLocation] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const res = await fetch('/api/volunteer/apply');
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore nel caricamento');
        setLoading(false);
        return;
      }

      if (data.message && data.organizations.length === 0) {
        setNoLocation(true);
        setError(data.message);
      } else {
        setOrganizations(data.organizations || []);
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedOrg) {
      setError('Seleziona un ente');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/volunteer/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: selectedOrg,
          profile,
          note: note.trim() || undefined,
          cvUrl: cvUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Candidatura inviata! Riceverai una notifica quando l\'ente la revisionerà.');
        setSelectedOrg('');
        setProfile('');
        setNote('');
        setCvUrl('');
        setTimeout(() => router.push('/donor/dashboard'), 2000);
      } else {
        setError(data.error || 'Errore durante l\'invio');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/donor/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Torna alla dashboard
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🤝</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Diventa Volontario</h1>
            <p className="text-gray-600">Canditati per supportare gli enti del tuo territorio</p>
          </div>
        </div>

        {noLocation && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 text-sm">
              <strong>Coordinate non disponibili:</strong> {error}
            </p>
            <p className="text-amber-700 text-sm mt-2">
              Completa il tuo profilo con un indirizzo valido per vedere gli enti disponibili nel raggio di 30km.
            </p>
            <Link
              href="/donor/profile"
              className="inline-block mt-3 text-sm text-primary-600 hover:underline"
            >
              Vai al mio profilo →
            </Link>
          </div>
        )}

        {error && !noLocation && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {!noLocation && organizations.length === 0 && !loading && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🏢</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun ente disponibile</h3>
            <p className="text-gray-500">
              Non ci sono enti verificati nel raggio di 30km dalla tua posizione.
            </p>
          </div>
        )}

        {!noLocation && organizations.length > 0 && (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleziona l'ente per cui vuoi candidarti
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {organizations.map(org => (
                  <label
                    key={org.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                      selectedOrg === org.id
                        ? 'bg-primary-50 border border-primary-300'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <input
                      type="radio"
                      name="organization"
                      value={org.id}
                      checked={selectedOrg === org.id}
                      onChange={() => setSelectedOrg(org.id)}
                      className="text-primary-600"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{org.name}</p>
                      <p className="text-sm text-gray-500">
                        {org.address && `${org.address}, `}{org.city} ({org.province})
                      </p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {formatDistance(org.distance)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profilo preferito (opzionale)
              </label>
              <select
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {PROFILES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Seleziona il tipo di attività che preferisci. Non obbligatorio.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note per l'ente (opzionale)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Racconta qualcosa su di te, le tue esperienze o motivazioni..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Le tue note saranno visibili all'ente quando revisionerà la tua candidatura.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link al tuo CV (opzionale)
              </label>
              <input
                type="url"
                value={cvUrl}
                onChange={(e) => setCvUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Inserisci un link pubblico al tuo CV (es. Google Drive, Dropbox, LinkedIn).
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedOrg}
              className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Invio in corso...' : 'Invia candidatura'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-gray-500">
            I tuoi dati di contatto saranno condivisi con l'ente per permettere il coordinamento delle attività.
          </p>
        </div>
      </div>
    </div>
  );
}