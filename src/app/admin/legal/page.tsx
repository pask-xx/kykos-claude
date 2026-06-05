'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { toast } from '@/components/ui/Toast';

type LegalDocumentType = 'TERMS' | 'PRIVACY';
type LegalDocumentStatus = 'scheduled' | 'active' | 'archived';

interface LegalDocVersion {
  id: string;
  type: LegalDocumentType;
  version: string;
  hash: string;
  fileSize: number;
  status: LegalDocumentStatus;
  uploadedAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
  notes: string | null;
  uploadedBy: { email: string; name: string };
}

const TYPE_LABELS: Record<LegalDocumentType, string> = {
  TERMS: 'Termini di Servizio',
  PRIVACY: 'Informativa Privacy',
};

const STATUS_LABELS: Record<LegalDocumentStatus, { label: string; classes: string }> = {
  scheduled: { label: 'Programmata', classes: 'bg-gray-100 text-gray-700' },
  active: { label: 'Attiva', classes: 'bg-green-100 text-green-700' },
  archived: { label: 'Archiviata', classes: 'bg-amber-100 text-amber-700' },
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateHash(hash: string): string {
  return `${hash.slice(0, 8)}…${hash.slice(-8)}`;
}

export default function AdminLegalPage() {
  const { data, isLoading, mutate, error } = useSWR<{ versions: LegalDocVersion[] }>(
    '/api/admin/legal',
    fetcher,
    { refreshInterval: 10000, revalidateOnFocus: true }
  );

  const [uploadModal, setUploadModal] = useState<{ open: boolean; type: LegalDocumentType | null }>({
    open: false,
    type: null,
  });
  const [confirmAction, setConfirmAction] = useState<
    | null
    | {
        kind: 'publish' | 'archive' | 'delete';
        version: LegalDocVersion;
      }
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const versions = data?.versions ?? [];

  const grouped = (type: LegalDocumentType) => versions.filter(v => v.type === type);
  const activeFor = (type: LegalDocumentType) => grouped(type).find(v => v.status === 'active');

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    setActionError(null);
    try {
      let endpoint: string;
      let method: 'POST' | 'DELETE';
      if (confirmAction.kind === 'publish') {
        endpoint = `/api/admin/legal/${confirmAction.version.id}/publish`;
        method = 'POST';
      } else if (confirmAction.kind === 'archive') {
        endpoint = `/api/admin/legal/${confirmAction.version.id}/archive`;
        method = 'POST';
      } else {
        endpoint = `/api/admin/legal/${confirmAction.version.id}`;
        method = 'DELETE';
      }
      const res = await fetch(endpoint, { method });
      const body = await res.json();
      if (!res.ok) {
        setActionError(body.error || "Errore durante l'operazione");
        return;
      }
      const successMsg =
        confirmAction.kind === 'delete'
          ? `Versione v${confirmAction.version.version} eliminata.`
          : body.message ?? 'Operazione completata';
      toast.success(successMsg);
      setConfirmAction(null);
      mutate();
    } catch (err) {
      console.error(err);
      setActionError('Errore di connessione');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documenti legali</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestisci le versioni di Termini di Servizio e Informativa Privacy. Ogni
          pubblicazione forza il re-consenso a tutti gli utenti loggati.
        </p>
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-center py-8">Caricamento…</p>
      ) : error ? (
        <p className="text-red-600 text-center py-8">Errore nel caricamento delle versioni</p>
      ) : (
        <div className="space-y-6">
          {(['TERMS', 'PRIVACY'] as LegalDocumentType[]).map(type => {
            const list = grouped(type);
            const active = activeFor(type);
            return (
              <div key={type} className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{TYPE_LABELS[type]}</h2>
                    {active ? (
                      <p className="text-sm text-gray-500 mt-1">
                        Versione attiva:{' '}
                        <span className="font-mono font-semibold text-gray-900">{active.version}</span>{' '}
                        · pubblicata il {formatDate(active.publishedAt)}
                      </p>
                    ) : (
                      <p className="text-sm text-red-600 mt-1">
                        ⚠️ Nessuna versione attiva: tutti gli utenti riceveranno il re-consenso.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setUploadModal({ open: true, type })}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm flex items-center gap-2"
                  >
                    <span>⬆️</span>
                    <span>Carica nuova versione</span>
                  </button>
                </div>

                {list.length === 0 ? (
                  <p className="text-gray-500 text-center py-6 text-sm">
                    Nessuna versione caricata. Carica la prima versione per rendere il
                    documento disponibile agli utenti.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {list.map(v => {
                      const statusInfo = STATUS_LABELS[v.status];
                      return (
                        <div
                          key={v.id}
                          className="p-4 border rounded-lg flex items-start gap-4"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-mono font-semibold text-gray-900">
                                v{v.version}
                              </span>
                              <span className={`px-2 py-0.5 text-xs rounded ${statusInfo.classes}`}>
                                {statusInfo.label}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatFileSize(v.fileSize)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate" title={v.hash}>
                              SHA-256: <span className="font-mono">{truncateHash(v.hash)}</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              Caricata il {formatDate(v.uploadedAt)} da {v.uploadedBy.name} ({v.uploadedBy.email})
                            </p>
                            {v.publishedAt && (
                              <p className="text-xs text-gray-500">
                                Pubblicata: {formatDate(v.publishedAt)}
                              </p>
                            )}
                            {v.archivedAt && (
                              <p className="text-xs text-gray-500">
                                Archiviata: {formatDate(v.archivedAt)}
                              </p>
                            )}
                            {v.notes && (
                              <p className="text-xs text-gray-700 mt-2 italic">
                                Note: {v.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            {v.status === 'scheduled' && (
                              <>
                                <button
                                  onClick={() => {
                                    setActionError(null);
                                    setConfirmAction({ kind: 'publish', version: v });
                                  }}
                                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                >
                                  Pubblica
                                </button>
                                <button
                                  onClick={() => {
                                    setActionError(null);
                                    setConfirmAction({ kind: 'delete', version: v });
                                  }}
                                  className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 text-sm font-medium"
                                >
                                  Elimina
                                </button>
                              </>
                            )}
                            {v.status === 'active' && (
                              <button
                                onClick={() => {
                                  setActionError(null);
                                  setConfirmAction({ kind: 'archive', version: v });
                                }}
                                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
                              >
                                Archivia
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {uploadModal.open && uploadModal.type && (
        <UploadModal
          type={uploadModal.type}
          onClose={() => setUploadModal({ open: false, type: null })}
          onSuccess={msg => {
            toast.success(msg);
            setUploadModal({ open: false, type: null });
            mutate();
          }}
        />
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !actionLoading && setConfirmAction(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {confirmAction.kind === 'publish'
                ? 'Conferma pubblicazione'
                : confirmAction.kind === 'archive'
                ? 'Conferma archiviazione'
                : 'Conferma eliminazione'}
            </h3>
            {confirmAction.kind === 'publish' ? (
              <p className="text-gray-600 mb-2">
                Stai per pubblicare la versione{' '}
                <span className="font-mono font-semibold">{confirmAction.version.version}</span> di{' '}
                <strong>{TYPE_LABELS[confirmAction.version.type]}</strong>.
              </p>
            ) : confirmAction.kind === 'archive' ? (
              <p className="text-gray-600 mb-2">
                Stai per archiviare la versione{' '}
                <span className="font-mono font-semibold">{confirmAction.version.version}</span> di{' '}
                <strong>{TYPE_LABELS[confirmAction.version.type]}</strong>.
              </p>
            ) : (
              <p className="text-gray-600 mb-2">
                Stai per eliminare definitivamente la versione{' '}
                <span className="font-mono font-semibold">{confirmAction.version.version}</span> di{' '}
                <strong>{TYPE_LABELS[confirmAction.version.type]}</strong>.
              </p>
            )}
            {confirmAction.kind === 'publish' && (
              <div className="my-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
                <p>
                  <strong>⚠️ Attenzione:</strong> tutti gli utenti loggati riceveranno
                  la schermata di re-consenso al prossimo accesso. La versione
                  attualmente attiva (se presente) verrà archiviata.
                </p>
              </div>
            )}
            {confirmAction.kind === 'archive' && (
              <div className="my-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
                <p>
                  Dopo l&apos;archiviazione, <strong>nessuna versione</strong> risulterà
                  attiva per questo documento e tutti gli utenti riceveranno il
                  re-consenso.
                </p>
              </div>
            )}
            {confirmAction.kind === 'delete' && (
              <div className="my-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                <p>
                  <strong>⚠️ Operazione irreversibile.</strong> Il record e il file
                  PDF verranno eliminati definitivamente dal database e da
                  Supabase Storage. La versione non è mai stata pubblicata, quindi
                  nessun utente l&apos;ha mai vista — è sicuro eliminarla.
                </p>
                <p className="mt-2">
                  Potrai ricaricare la stessa versione (es. v
                  {confirmAction.version.version}) tramite il bottone &quot;Carica nuova
                  versione&quot;.
                </p>
              </div>
            )}
            {actionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {actionError}
              </div>
            )}
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setConfirmAction(null);
                  setActionError(null);
                }}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirm}
                disabled={actionLoading}
                className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                  confirmAction.kind === 'publish'
                    ? 'bg-green-600 hover:bg-green-700'
                    : confirmAction.kind === 'archive'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionLoading
                  ? 'Operazione in corso…'
                  : confirmAction.kind === 'publish'
                  ? 'Pubblica'
                  : confirmAction.kind === 'archive'
                  ? 'Archivia'
                  : 'Elimina definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function UploadModal({
  type,
  onClose,
  onSuccess,
}: {
  type: LegalDocumentType;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !version) {
      setError('File e versione sono obbligatori');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('version', version);
      if (notes.trim()) formData.append('notes', notes.trim());

      const res = await fetch('/api/admin/legal/upload', {
        method: 'POST',
        body: formData,
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || 'Errore durante l\'upload');
        return;
      }
      onSuccess(
        `Versione v${body.version} caricata come "Programmata". Clicca "Pubblica" per renderla attiva.`
      );
    } catch (err) {
      console.error(err);
      setError('Errore di connessione');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => !uploading && onClose()} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Carica nuova versione
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {TYPE_LABELS[type]}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File PDF <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              required
              disabled={uploading}
              className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <p className="text-xs text-gray-500 mt-1">Max 10MB. Solo PDF.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Versione <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={version}
              onChange={e => setVersion(e.target.value)}
              placeholder="es. 1.0, 1.2, 2.0"
              pattern="^\d+\.\d+(\.\d+)?$"
              required
              disabled={uploading}
              className="block w-full px-3 py-2 border rounded-lg text-sm font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">Formato semver: 1.0, 1.2.3</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (changelog)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              disabled={uploading}
              className="block w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="es. Riformulazione art. 5, allineamento GDPR 2026"
            />
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {uploading ? 'Caricamento…' : 'Carica'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
