'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import ImageUploader from '@/components/ImageUploader';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDate } from '@/lib/utils';
import { CATEGORY_LABELS, Category } from '@/types';

interface BeneficiaryRequest {
  id: string;
  needScoreSnapshot: number;
  requestedAt: string;
  status: 'PENDING' | 'ASSIGNED' | 'REJECTED' | 'FULFILLED' | 'CANCELLED';
  qrCode: string | null;
  beneficiary: {
    id: string;
    nickname: string | null;
    name: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    needScore: number;
  };
}

interface MultiAvailability {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  imageUrls: string[];
  availableQty: number;
  assignedQty: number;
  status: 'OPEN' | 'CLOSED' | 'EXHAUSTED';
  deadline: string | null;
  exhaustMessage: string | null;
  organization: { id: string; name: string };
  requests: BeneficiaryRequest[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING': return 'bg-amber-100 text-amber-700';
    case 'ASSIGNED': return 'bg-green-100 text-green-700';
    case 'REJECTED': return 'bg-red-100 text-red-700';
    case 'FULFILLED': return 'bg-blue-100 text-blue-700';
    case 'CANCELLED': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDING': return 'In attesa';
    case 'ASSIGNED': return 'Assegnato';
    case 'REJECTED': return 'Scartato';
    case 'FULFILLED': return 'Ritirato';
    case 'CANCELLED': return 'Cancellato';
    default: return status;
  }
};

export default function AvailabilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [availability, setAvailability] = useState<MultiAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'needScore' | 'requestedAt'>('needScore');
  const [saving, setSaving] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [sendingNotifications, setSendingNotifications] = useState(false);
  const [closing, setClosing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notifyAndClose, setNotifyAndClose] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAvailableQty, setEditAvailableQty] = useState(0);
  const [editDeadline, setEditDeadline] = useState('');
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);

  useEffect(() => {
    fetchAvailability();
  }, [id]);

  const fetchAvailability = async () => {
    try {
      const res = await fetch(`/api/operator/multi-availability/${id}?t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setAvailability(data.availability);
        setNotifyMessage(data.availability.exhaustMessage || '');
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sortedRequests = [...(availability?.requests || [])].sort((a, b) => {
    if (sortBy === 'needScore') {
      return b.beneficiary.needScore - a.beneficiary.needScore;
    }
    return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
  });

  const toggleSelection = (requestId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId);
    } else {
      newSelected.add(requestId);
    }
    setSelectedIds(newSelected);
  };

  const selectFirstN = (n: number) => {
    const pending = sortedRequests.filter(r => r.status === 'PENDING');
    const toSelect = pending.slice(0, n).map(r => r.id);
    setSelectedIds(new Set(toSelect));
  };

  const handleAssign = async () => {
    if (selectedIds.size === 0) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/operator/multi-availability/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestIds: Array.from(selectedIds) }),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        fetchAvailability();
      } else {
        const err = await res.json();
        alert(err.error || 'Errore');
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSendNotifications = async () => {
    setSendingNotifications(true);
    try {
      const res = await fetch(`/api/operator/multi-availability/${id}/notify-exhausted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customMessage: notifyMessage }),
      });

      if (res.ok) {
        setShowNotifyModal(false);
        if (notifyAndClose) {
          await handleClose();
        } else {
          fetchAvailability();
        }
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSendingNotifications(false);
      setNotifyAndClose(false);
    }
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      const res = await fetch(`/api/operator/multi-availability/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED' }),
      });

      if (res.ok) {
        setShowCloseModal(false);
        fetchAvailability();
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setClosing(false);
    }
  };

  const handleEdit = async () => {
    setEditing(true);
    try {
      const res = await fetch(`/api/operator/multi-availability/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription || null,
          availableQty: editAvailableQty,
          deadline: editDeadline ? new Date(editDeadline) : null,
          imageUrls: editImageUrls,
        }),
      });

      if (res.ok) {
        setShowEditModal(false);
        fetchAvailability();
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setEditing(false);
    }
  };

  const pendingRequests = sortedRequests.filter(r => r.status === 'PENDING');
  const assignedRequests = sortedRequests.filter(r => r.status === 'ASSIGNED' || r.status === 'FULFILLED');
  const remainingQty = (availability?.availableQty || 0) - (availability?.assignedQty || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!availability) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Disponibilità non trovata</p>
          <Link href="/operator/availability" className="text-primary-600 hover:underline">
            ← Torna alla lista
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <Link href="/operator/availability" className="text-sm text-gray-500 hover:text-primary-600 mb-2 inline-flex items-center gap-1">
          ← Torna alla lista
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{availability.title}</h1>
            <p className="text-gray-500">{CATEGORY_LABELS[availability.category]}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600">{availability.assignedQty}/{availability.availableQty}</p>
            <p className="text-sm text-gray-500">assegnati</p>
            <div className="flex gap-2 mt-2 justify-end">
              <button
                onClick={() => {
                  setEditTitle(availability.title);
                  setEditDescription(availability.description || '');
                  setEditAvailableQty(availability.availableQty);
                  setEditDeadline(availability.deadline ? new Date(availability.deadline).toISOString().slice(0, 16) : '');
                  setEditImageUrls(availability.imageUrls || []);
                  setShowEditModal(true);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Modifica
              </button>
              {availability.status === 'OPEN' && (
                <button
                  onClick={() => setShowCloseModal(true)}
                  className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                >
                  Chiudi
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border">
          <p className="text-xs sm:text-sm text-gray-500 truncate">Totale richieste</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{availability.requests.length}</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border">
          <p className="text-xs sm:text-sm text-gray-500 truncate">In attesa</p>
          <p className="text-xl sm:text-2xl font-bold text-amber-600">{pendingRequests.length}</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border">
          <p className="text-xs sm:text-sm text-gray-500 truncate">Assegnati</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600">{assignedRequests.length}</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border">
          <p className="text-xs sm:text-sm text-gray-500 truncate">Disponibili</p>
          <p className="text-xl sm:text-2xl font-bold text-primary-600">{remainingQty}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Ordina per:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'needScore' | 'requestedAt')}
              className="px-3 py-1.5 border rounded-lg text-sm"
            >
              <option value="needScore">Score di bisogno</option>
              <option value="requestedAt">Data richiesta</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Seleziona primi:</span>
            <button
              onClick={() => selectFirstN(remainingQty)}
              disabled={remainingQty <= 0}
              className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm hover:bg-primary-200 disabled:opacity-50"
            >
              {remainingQty} (disponibili)
            </button>
            <button
              onClick={() => selectFirstN(5)}
              disabled={pendingRequests.length < 5}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50"
            >
              5
            </button>
            <button
              onClick={() => selectFirstN(10)}
              disabled={pendingRequests.length < 10}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50"
            >
              10
            </button>
            <button
              onClick={() => selectFirstN(20)}
              disabled={pendingRequests.length < 20}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50"
            >
              20
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{selectedIds.size} selezionati</span>
            <button
              onClick={() => setSelectedIds(new Set())}
              disabled={selectedIds.size === 0}
              className="px-3 py-1.5 border text-gray-700 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Deseleziona
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              disabled={selectedIds.size === 0 || saving}
              className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Assegnazione...' : `Assegna (${selectedIds.size})`}
            </button>
          </div>
        </div>
      </div>

      {/* Request List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Richieste ({pendingRequests.length} in attesa)</h2>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nessuna richiesta in attesa
          </div>
        ) : (
          <div className="divide-y">
            {pendingRequests.map((request) => {
              const fullName = [request.beneficiary.firstName, request.beneficiary.lastName].filter(Boolean).join(' ');
              const displayName = request.beneficiary.nickname || request.beneficiary.name || fullName;

              return (
                <div key={request.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(request.id)}
                    onChange={() => toggleSelection(request.id)}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{displayName}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${request.beneficiary.needScore >= 80 ? 'bg-red-100 text-red-700' : request.beneficiary.needScore >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        Score: {request.beneficiary.needScore}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{request.beneficiary.email}</p>
                  </div>
                  <div className="text-right text-sm text-gray-400">
                    <p>{formatDate(request.requestedAt)}</p>
                    <p>Score snapshot: {request.needScoreSnapshot}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assigned List */}
      {assignedRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Assegnati ({assignedRequests.length})</h2>
          </div>
          <div className="divide-y">
            {assignedRequests.map((request) => {
              const fullName = [request.beneficiary.firstName, request.beneficiary.lastName].filter(Boolean).join(' ');
              const displayName = request.beneficiary.nickname || request.beneficiary.name || fullName;

              return (
                <div key={request.id} className="p-4 flex items-center gap-4 bg-green-50">
                  <span className="text-green-600">✓</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{displayName}</p>
                    <p className="text-sm text-gray-500">{request.beneficiary.email}</p>
                  </div>
                  {request.qrCode && (
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{request.qrCode}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notify Button */}
      <div className="flex justify-end">
        <ConfirmDialog
          title="Notifica scorte esaurite"
          message={`Invia notifica a ${pendingRequests.length} beneficiari che non hanno ricevuto l'assegnazione?`}
          confirmLabel="Procedi"
          variant="warning"
          onConfirm={() => setShowNotifyModal(true)}
        >
          <button
            disabled={pendingRequests.length === 0}
            className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            Notifica scorte esaurite ai non assegnati
          </button>
        </ConfirmDialog>
      </div>

      {/* Notify Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowNotifyModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Notifica scorte esaurite</h2>
            <p className="text-sm text-gray-500 mb-4">
              Questo messaggio sarà inviato a {pendingRequests.length} beneficiari che non hanno ricevuto l&apos;assegnazione.
            </p>
            <textarea
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Messaggio per chi non ha ricevuto l'assegnazione..."
            />
            <label className="flex items-center gap-2 mt-4 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyAndClose}
                onChange={(e) => setNotifyAndClose(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
              />
              <span>Chiudi anche la distribuzione corrente</span>
            </label>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNotifyModal(false)}
                className="flex-1 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleSendNotifications}
                disabled={sendingNotifications}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {sendingNotifications ? 'Invio...' : notifyAndClose ? 'Procedi e chiudi' : 'Procedi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Confirmation Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAssignModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Conferma assegnazione</h2>
            <p className="text-sm text-gray-600 mb-4">
              Stai per assegnare <strong>{selectedIds.size}</strong> beneficiari. Questa azione assegnerà i QR code di ritiro e non potrà essere annullata.
            </p>
            {remainingQty < selectedIds.size && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  Attenzione: stai assegnando più beneficiari dei posti disponibili ({remainingQty}).
                </p>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={async () => {
                  setShowAssignModal(false);
                  await handleAssign();
                }}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Assegnazione...' : `Assegna ${selectedIds.size}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Modifica disponibilità</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numero disponibilità</label>
                <input
                  type="number"
                  min="1"
                  value={editAvailableQty}
                  onChange={(e) => setEditAvailableQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scadenza</label>
                <input
                  type="datetime-local"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto</label>
                <ImageUploader
                  onImagesChange={setEditImageUrls}
                  maxFiles={5}
                  currentImages={editImageUrls}
                />
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
                disabled={editing}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
              >
                {editing ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Confirmation Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCloseModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chiudi disponibilità</h3>
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler chiudere questa disponibilità? Non sarà più possibile ricevere nuove richieste.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annulla
              </button>
              <button
                onClick={handleClose}
                disabled={closing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
              >
                {closing ? 'Chiusura...' : 'Conferma'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}