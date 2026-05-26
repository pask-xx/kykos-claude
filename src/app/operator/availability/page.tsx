'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { CATEGORY_LABELS, Category } from '@/types';

interface MultiAvailability {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  availableQty: number;
  assignedQty: number;
  status: 'OPEN' | 'CLOSED' | 'EXHAUSTED';
  deadline: string | null;
  createdAt: string;
  _count?: {
    requests: number;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'OPEN': return 'bg-green-100 text-green-700';
    case 'CLOSED': return 'bg-gray-100 text-gray-700';
    case 'EXHAUSTED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'OPEN': return 'Aperta';
    case 'CLOSED': return 'Chiusa';
    case 'EXHAUSTED': return 'Esaurita';
    default: return status;
  }
};

export default function MultiAvailabilityPage() {
  const [availabilities, setAvailabilities] = useState<MultiAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('OTHER');
  const [availableQty, setAvailableQty] = useState(10);
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    fetchAvailabilities();
  }, []);

  const fetchAvailabilities = async () => {
    try {
      const res = await fetch('/api/operator/multi-availability');
      if (res.ok) {
        const data = await res.json();
        setAvailabilities(data.availabilities || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!title || availableQty < 1) return;

    setCreating(true);
    try {
      const res = await fetch('/api/operator/multi-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          availableQty: parseInt(availableQty.toString()),
          deadline: deadline || null,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchAvailabilities();
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('OTHER');
    setAvailableQty(10);
    setDeadline('');
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disponibilità multipla</h1>
          <p className="text-gray-500">Gestisci offerte con assegnazione manuale</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
        >
          + Nuova disponibilità
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Caricamento...</p>
        </div>
      ) : availabilities.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
          <span className="text-5xl mb-4 block">📦</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessuna disponibilità</h2>
          <p className="text-gray-500">Crea la tua prima disponibilità multipla</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {availabilities.map((avail) => (
            <Link
              key={avail.id}
              href={`/operator/availability/${avail.id}`}
              className="bg-white p-4 rounded-xl shadow-sm border hover:border-primary-300 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{avail.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(avail.status)}`}>
                      {getStatusLabel(avail.status)}
                    </span>
                  </div>
                  {avail.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{avail.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>{CATEGORY_LABELS[avail.category]}</span>
                    <span className="font-medium">{avail.assignedQty}/{avail.availableQty} assegnati</span>
                    {avail._count?.requests ? (
                      <span>{avail._count.requests} richieste pendenti</span>
                    ) : null}
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {formatDate(avail.createdAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nuova disponibilità multipla</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titolo *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Es. Pacchi alimentari"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Dettagli sulla disponibilità..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantità disponibile *</label>
                <input
                  type="number"
                  min="1"
                  value={availableQty}
                  onChange={(e) => setAvailableQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scadenza (opzionale)</label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !title || availableQty < 1}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {creating ? 'Creazione...' : 'Crea'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}