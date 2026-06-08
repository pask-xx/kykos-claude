'use client';

import { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import ImageUploader from '@/components/ImageUploader';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDate } from '@/lib/utils';

interface Cause {
  id: string;
  title: string;
  description: string;
  imageUrls: string[];
  targetQty: number | null;
  deadline: string | null;
  createdAt: string;
  participantCount: number;
}

export default function CausesPage() {
  const [causes, setCauses] = useState<Cause[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTargetQty, setEditTargetQty] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const titleId = useId();
  const descriptionId = useId();
  const targetId = useId();
  const deadlineId = useId();
  const photoId = useId();

  const fetchCauses = async () => {
    try {
      const res = await fetch('/api/operator/cause');
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

  useEffect(() => {
    fetchCauses();
  }, []);

  const handleCreate = async () => {
    if (!editTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/operator/cause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          targetQty: editTargetQty ? parseInt(editTargetQty) : null,
          deadline: editDeadline ? new Date(editDeadline) : null,
          imageUrls: editImageUrls,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setEditTitle('');
        setEditDescription('');
        setEditTargetQty('');
        setEditDeadline('');
        setEditImageUrls([]);
        fetchCauses();
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/operator/cause/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeletingId(null);
        fetchCauses();
      }
    } catch (err) {
      console.error('Error:', err);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cause</h1>
          <p className="text-gray-500">Gestisci le cause di raccolta fondi</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
        >
          + Nuova causa
        </button>
      </div>

      {causes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">
          Nessuna causa creata. Clicca "Nuova causa" per iniziare.
        </div>
      ) : (
        <div className="grid gap-4">
          {causes.map((cause) => (
            <div key={cause.id} className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-start gap-4">
                {cause.imageUrls && cause.imageUrls.length > 0 && (
                  <img
                    src={cause.imageUrls[0]}
                    alt={cause.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/operator/cause/${cause.id}`} className="hover:text-primary-600">
                    <h2 className="text-lg font-semibold text-gray-900">{cause.title}</h2>
                  </Link>
                  <p className="text-sm text-gray-500 line-clamp-2">{cause.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                    <span>{cause.participantCount} partecipanti</span>
                    {cause.targetQty && <span>Target: {cause.targetQty}</span>}
                    {cause.deadline && <span>Scadenza: {formatDate(cause.deadline)}</span>}
                  </div>
                </div>
                <ConfirmDialog
                  title="Elimina causa"
                  message="Sei sicuro di voler eliminare questa causa? L'azione non può essere annullata."
                  confirmLabel="Elimina"
                  variant="danger"
                  onConfirm={() => handleDelete(cause.id)}
                >
                  <button
                    type="button"
                    aria-label="Elimina causa"
                    className="p-2 text-gray-400 hover:text-red-600"
                    title="Elimina"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </ConfirmDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nuova causa</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor={titleId} className="block text-sm font-medium text-gray-700 mb-1">Titolo *</label>
                <input
                  id={titleId}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="es. Raccolta fondi per la mensa..."
                />
              </div>
              <div>
                <label htmlFor={descriptionId} className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                <textarea
                  id={descriptionId}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Descrivi la causa e le istruzioni per aderire..."
                />
              </div>
              <div>
                <label htmlFor={targetId} className="block text-sm font-medium text-gray-700 mb-1">Target (opzionale)</label>
                <input
                  id={targetId}
                  type="number"
                  min="1"
                  value={editTargetQty}
                  onChange={(e) => setEditTargetQty(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Lascia vuoto per illimitato"
                />
              </div>
              <div>
                <label htmlFor={deadlineId} className="block text-sm font-medium text-gray-700 mb-1">Scadenza (opzionale)</label>
                <input
                  id={deadlineId}
                  type="datetime-local"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <span id={photoId} className="block text-sm font-medium text-gray-700 mb-1">Foto</span>
                <div aria-labelledby={photoId}>
                  <ImageUploader
                    onImagesChange={setEditImageUrls}
                    maxFiles={5}
                    currentImages={editImageUrls}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annulla
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !editTitle.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
              >
                {creating ? 'Creazione...' : 'Crea causa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
