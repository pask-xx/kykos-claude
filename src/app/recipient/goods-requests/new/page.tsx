'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function NewGoodsRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

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
      const res = await fetch('/api/goods-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, description }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/recipient/goods-requests');
      } else {
        setError(data.error || 'Errore durante la creazione');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-medium text-gray-900">Nuova richiesta di beni</h1>
        <p className="text-gray-500">Descrivi il bene di cui hai bisogno</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titolo *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Es: Tavolo da cucina, PC portatile, Vestiti invernali"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria *
          </label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-1 ${
                  category === cat.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrizione (opzionale)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Aggiungi dettagli sul bene che stai cercando: dimensioni, condizione, colore, ecc."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1 text-right">{description.length}/1000</p>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
          >
            {loading ? 'Creazione...' : 'Crea richiesta'}
          </button>
          <Link
            href="/recipient/goods-requests"
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            Annulla
          </Link>
        </div>
      </form>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Nota:</strong> La tua richiesta sarà inviata all'ente di riferimento per l'approvazione. Una volta approvata, sarà visibile ai donatori che potranno offrire il bene di cui hai bisogno.
        </p>
      </div>
    </div>
  );
}