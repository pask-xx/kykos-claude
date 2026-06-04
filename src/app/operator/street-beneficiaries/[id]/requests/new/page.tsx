'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Textarea, Card, CardHeader, CardTitle, CardContent, Alert, Spinner } from '@/components/ui';

const categories = [
  { value: 'FURNITURE', label: 'Arredamento', icon: '🪑' },
  { value: 'ELECTRONICS', label: 'Elettronica', icon: '📱' },
  { value: 'CLOTHING', label: 'Abbigliamento', icon: '👕' },
  { value: 'BOOKS', label: 'Libri', icon: '📚' },
  { value: 'KITCHEN', label: 'Cucina', icon: '🍳' },
  { value: 'SPORTS', label: 'Sport', icon: '⚽' },
  { value: 'TOYS', label: 'Giocattoli', icon: '🧸' },
  { value: 'OTHER', label: 'Altro', icon: '📦' },
];

interface StreetBeneficiary {
  id: string;
  nickname: string | null;
  firstName: string;
  lastName: string;
  referenceEntity?: {
    id: string;
    name: string;
  };
}

export default function NewStreetBeneficiaryRequestPage() {
  const router = useRouter();
  const params = useParams();
  const beneficiaryId = params.id as string;

  const [beneficiary, setBeneficiary] = useState<StreetBeneficiary | null>(null);
  const [loadingBeneficiary, setLoadingBeneficiary] = useState(true);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'GOODS' | 'SERVICES'>('GOODS');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchBeneficiary() {
      try {
        const res = await fetch(`/api/operator/street-beneficiaries/${beneficiaryId}`);
        if (!res.ok) throw new Error('Beneficiario non trovato');
        const data = await res.json();
        setBeneficiary(data.beneficiary);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore nel caricamento del beneficiario');
      } finally {
        setLoadingBeneficiary(false);
      }
    }

    if (beneficiaryId) {
      fetchBeneficiary();
    }
  }, [beneficiaryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Il titolo è obbligatorio');
      return;
    }
    if (!category) {
      setError('Seleziona una categoria');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/operator/street-beneficiary-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beneficiaryId, title, category, type, description }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/operator/street-beneficiaries');
      } else {
        setError(data.error || 'Errore durante la creazione');
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  if (loadingBeneficiary) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!beneficiary) {
    return (
      <Alert type="error" title="Errore">
        {error || 'Beneficiario non trovato'}
      </Alert>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-medium text-gray-900">Nuova richiesta</h1>
        <p className="text-gray-500">
          Per <strong>{beneficiary.firstName} {beneficiary.lastName}</strong>
          {beneficiary.referenceEntity && (
            <span> — {beneficiary.referenceEntity.name}</span>
          )}
        </p>
      </div>

      {error && (
        <Alert type="error" title="Errore">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo di richiesta *
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setType('GOODS')}
              className={`flex-1 p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                type === 'GOODS'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-3xl">🪑</span>
              <span className="font-medium">Bene</span>
              <span className="text-xs text-gray-500">Oggetto materiale</span>
            </button>
            <button
              type="button"
              onClick={() => setType('SERVICES')}
              className={`flex-1 p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                type === 'SERVICES'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-3xl">🔧</span>
              <span className="font-medium">Servizio</span>
              <span className="text-xs text-gray-500">Lavoro o attività</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-1.5 ${
                  category === cat.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titolo *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === 'GOODS' ? 'Es: Tavolo da cucina, PC portatile, Vestiti invernali' : 'Es: Riparazione idraulica, Trasloco, Lezioni private'}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrizione (opzionale)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={type === 'GOODS' ? 'Aggiungi dettagli sul bene: dimensioni, condizione, colore, ecc.' : 'Descrivi il servizio di cui hai bisogno: quando, dove, durata stimata, ecc.'}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1 text-right">{description.length}/1000</p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" variant="primary" loading={loading}>
            Crea richiesta
          </Button>
          <Link href="/operator/street-beneficiaries">
            <Button type="button" variant="secondary">
              Annulla
            </Button>
          </Link>
        </div>
      </form>

      <Alert type="info" title="Visibilità">
        La richiesta sarà visibile a tutti i donatori della diocesi e potrà essere soddisfatta da chiunque offra il bene o servizio richiesto.
      </Alert>
    </div>
  );
}
