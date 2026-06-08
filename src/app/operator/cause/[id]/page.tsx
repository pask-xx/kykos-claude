'use client';

import { useState, useEffect, use, useId } from 'react';
import Link from 'next/link';
import ImageUploader from '@/components/ImageUploader';
import { formatDate, formatDatetimeForInput } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

interface CauseParticipant {
  id: string;
  joinedAt: string;
  user: {
    id: string;
    nickname: string | null;
    name: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
  };
}

interface Cause {
  id: string;
  title: string;
  description: string;
  imageUrls: string[];
  targetQty: number | null;
  deadline: string | null;
  createdAt: string;
  participants: CauseParticipant[];
  organization: { id: string; name: string };
}

export default function CauseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [cause, setCause] = useState<Cause | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sending, setSending] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTargetQty, setEditTargetQty] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const editTitleId = useId();
  const editDescriptionId = useId();
  const editTargetId = useId();
  const editDeadlineId = useId();
  const editPhotoId = useId();
  const notifyMessageId = useId();
  const sendEmailId = useId();

  const fetchCause = async () => {
    try {
      const res = await fetch(`/api/operator/cause/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCause(data.cause);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCause();
  }, [id]);

  const handleEdit = async () => {
    if (!editTitle.trim()) return;
    setEditing(true);
    try {
      const res = await fetch(`/api/operator/cause/${id}`, {
        method: 'PATCH',
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
        setShowEditModal(false);
        fetchCause();
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setEditing(false);
    }
  };

  const handleNotify = async () => {
    if (!notifyMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/operator/cause/${id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: notifyMessage,
          sendEmail,
        }),
      });
      if (res.ok) {
        setShowNotifyModal(false);
        setNotifyMessage('');
        setSendEmail(false);
        toast.success('Messaggio inviato ai partecipanti');
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/operator/cause/${id}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/operator/cause';
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!cause) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-error-600 mb-4">Causa non trovata</p>
          <Link href="/operator/cause" className="text-primary-600 hover:underline">
            ← Torna alla lista
          </Link>
        </div>
      </div>
    );
  }

  const canDelete = cause.participants.length === 0;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Link href="/operator/cause" className="text-sm text-gray-500 hover:text-primary-600 inline-flex items-center gap-1">
          ← Torna alla lista
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{cause.title}</h1>
            <p className="text-gray-500 mt-1">{cause.organization.name}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditTitle(cause.title);
                setEditDescription(cause.description || '');
                setEditTargetQty(cause.targetQty?.toString() || '');
                setEditDeadline(cause.deadline ? formatDatetimeForInput(cause.deadline) : '');
                setEditImageUrls(cause.imageUrls || []);
                setShowEditModal(true);
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Modifica
            </button>
            {canDelete && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3 py-1.5 text-sm bg-error-100 text-error-700 rounded-lg hover:bg-error-200 font-medium"
              >
                Elimina
              </button>
            )}
          </div>
        </div>

        {/* Photos */}
        {cause.imageUrls && cause.imageUrls.length > 0 && (
          <div className="flex gap-2 mt-4">
            {cause.imageUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img
                  src={url}
                  alt={`Foto ${i + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border hover:ring-2 hover:ring-primary-500 cursor-pointer"
                />
              </a>
            ))}
          </div>
        )}

        {/* Description */}
        {cause.description && (
          <p className="text-gray-700 mt-4 whitespace-pre-wrap">{cause.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-900">{cause.participants.length}</p>
            <p className="text-sm text-gray-500">Partecipanti</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-900">
              {cause.targetQty ?? '∞'}
            </p>
            <p className="text-sm text-gray-500">Target</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-900">
              {cause.deadline ? formatDate(cause.deadline) : '—'}
            </p>
            <p className="text-sm text-gray-500">Scadenza</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Partecipanti ({cause.participants.length})
        </h2>
        <button
          onClick={() => {
            setNotifyMessage('');
            setSendEmail(false);
            setShowNotifyModal(true);
          }}
          disabled={cause.participants.length === 0}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
        >
          Invia comunicazione
        </button>
      </div>

      {/* Participants List */}
      {cause.participants.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">
          Nessun partecipante ancora
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="divide-y">
            {cause.participants.map((p) => {
              const fullName = [p.user.firstName, p.user.lastName].filter(Boolean).join(' ');
              const displayName = p.user.nickname || p.user.name || fullName;
              return (
                <div key={p.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{displayName}</p>
                    <p className="text-sm text-gray-500">{p.user.email}</p>
                  </div>
                  <div className="text-right text-sm text-gray-400">
                    <p>Iscritto il {formatDate(p.joinedAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Modifica causa</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor={editTitleId} className="block text-sm font-medium text-gray-700 mb-1">Titolo *</label>
                <input
                  id={editTitleId}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor={editDescriptionId} className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                <textarea
                  id={editDescriptionId}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor={editTargetId} className="block text-sm font-medium text-gray-700 mb-1">Target (opzionale)</label>
                <input
                  id={editTargetId}
                  type="number"
                  min="1"
                  value={editTargetQty}
                  onChange={(e) => setEditTargetQty(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor={editDeadlineId} className="block text-sm font-medium text-gray-700 mb-1">Scadenza (opzionale)</label>
                <input
                  id={editDeadlineId}
                  type="datetime-local"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <span id={editPhotoId} className="block text-sm font-medium text-gray-700 mb-1">Foto</span>
                <div aria-labelledby={editPhotoId}>
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
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annulla
              </button>
              <button
                onClick={handleEdit}
                disabled={editing || !editTitle.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
              >
                {editing ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notify Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowNotifyModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Invia comunicazione</h2>
            <p className="text-sm text-gray-500 mb-4">
              Il messaggio sarà inviato a {cause.participants.length} partecipanti.
            </p>
            <label htmlFor={notifyMessageId} className="sr-only">Messaggio comunicazione</label>
            <textarea
              id={notifyMessageId}
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Scrivi il tuo messaggio..."
            />
            <label htmlFor={sendEmailId} className="flex items-center gap-2 mt-4 text-sm text-gray-600 cursor-pointer">
              <input
                id={sendEmailId}
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span>Invia anche email</span>
            </label>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNotifyModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annulla
              </button>
              <button
                onClick={handleNotify}
                disabled={sending || !notifyMessage.trim()}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
              >
                {sending ? 'Invio...' : 'Invia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Elimina causa</h3>
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare questa causa? L&apos;azione non può essere annullata.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annulla
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 font-medium disabled:opacity-50"
              >
                {deleting ? 'Eliminazione...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
