'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, History, Undo2, Ban, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { canRevokeEntityObject } from '@/lib/entity-object-rules';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/types';
import { toast } from '@/components/ui/Toast';
import { Alert, Button, EmptyState, EntityListCard, Modal, Spinner } from '@/components/ui';
import {
  EMPTY_ENTITY_OBJECT_FORM,
  EntityObjectForm,
  type EntityObjectFormValues,
} from '@/components/operator/EntityObjectForm';
import {
  EntityObjectDetailModal,
  type EntityObjectDetail,
} from '@/components/operator/EntityObjectDetailModal';
import { EntityObjectStatusBadge } from '@/components/operator/EntityObjectStatusBadge';
import { ShelfLabelScanner } from '@/components/operator/ShelfLabelScanner';

/**
 * Magazzino dell'ente: le disponibilità pubblicate e ancora disponibili.
 *
 * Le consegnate stanno in /operator/entity-history, le revocate in
 * /operator/entity-revoked: qui restano solo ciò che l'ente può ancora
 * offrire ai beneficiari.
 */
export default function EntityAvailabilityPage() {
  const router = useRouter();
  const [objects, setObjects] = useState<EntityObjectDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Dettagli / modifica della disponibilità
  const [detailTarget, setDetailTarget] = useState<EntityObjectDetail | null>(null);

  // Revoca di una disponibilità pubblicata
  const [revokeTarget, setRevokeTarget] = useState<EntityObjectDetail | null>(null);
  const [revoking, setRevoking] = useState(false);

  // Form state (creazione)
  const [form, setForm] = useState<EntityObjectFormValues>(EMPTY_ENTITY_OBJECT_FORM);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    fetchObjects();
  }, []);

  const fetchObjects = async () => {
    try {
      const res = await fetch('/api/operator/entity-objects');
      if (res.ok) {
        const data = await res.json();
        const next: EntityObjectDetail[] = data.objects || [];
        setObjects(next);
        // Se la modale è aperta, allinea l'oggetto mostrato alla lista
        // appena ricaricata (dopo una modifica i dati devono aggiornarsi).
        setDetailTarget((current) =>
          current ? next.find((object) => object.id === current.id) ?? null : null
        );
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Errore nel caricamento');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  // --- Creazione -------------------------------------------------------------------

  const handleFormChange = (patch: Partial<EntityObjectFormValues>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast.error('Inserisci un titolo');
      return;
    }
    if (form.imageUrls.length === 0) {
      toast.error('Almeno una foto è obbligatoria');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/operator/entity-objects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          description: form.description || null,
          depositLocation: form.depositLocation || null,
          depositNotes: form.depositNotes || null,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchObjects();
        toast.success('Disponibilità pubblicata');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Errore durante la creazione');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Errore di connessione');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_ENTITY_OBJECT_FORM);
    // Forza il remount dell'uploader: tiene lo stato interno delle foto.
    setFormKey((key) => key + 1);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // --- Revoca disponibilità --------------------------------------------------------

  const handleRevoke = async () => {
    if (!revokeTarget) return;

    setRevoking(true);
    try {
      const res = await fetch(`/api/operator/entity-objects/${revokeTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke' }),
      });

      if (res.ok) {
        setRevokeTarget(null);
        setDetailTarget(null);
        await fetchObjects();
        toast.success('Disponibilità revocata');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Errore durante la revoca');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Errore di connessione');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Magazzino</h1>
          <p className="text-gray-500">
            Oggetti giacenti nei tuoi depositi: l&apos;ente ne è il donatore
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => router.push('/operator/entity-revoked')}
            leftIcon={<Ban className="w-4 h-4" aria-hidden="true" />}
          >
            Revocate
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/operator/entity-history')}
            leftIcon={<History className="w-4 h-4" aria-hidden="true" />}
          >
            Storico consegne
          </Button>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            + Nuova disponibilità
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : objects.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nessuna disponibilità"
          description="Pubblica il primo oggetto del tuo magazzino"
        />
      ) : (
        <div className="grid gap-4">
          {objects.map((obj) => {
            // La revoca è possibile solo se l'oggetto è ancora in giacenza
            // (non consegnato) e non ha richieste attive.
            const revocable = canRevokeEntityObject(obj.status, obj._count?.requests ?? 0);
            return (
              <EntityListCard
                key={obj.id}
                icon={
                  obj.imageUrls && obj.imageUrls.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={obj.imageUrls[0]}
                      alt={obj.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" aria-hidden="true" />
                  )
                }
                title={obj.title}
                badgesTop={
                  <>
                    <EntityObjectStatusBadge status={obj.status} />
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(obj.createdAt)}
                    </span>
                  </>
                }
                description={obj.description ?? undefined}
                meta={
                  <>
                    <span className="text-gray-500">{CATEGORY_LABELS[obj.category]}</span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="text-gray-500">{CONDITION_LABELS[obj.condition]}</span>
                    {obj.depositLocation ? (
                      <>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="text-gray-500">{obj.depositLocation}</span>
                      </>
                    ) : null}
                    {obj._count?.requests ? (
                      <>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="text-gray-500">
                          {obj._count.requests}{' '}
                          {obj._count.requests === 1 ? 'richiesta attiva' : 'richieste attive'}
                        </span>
                      </>
                    ) : null}
                  </>
                }
                footer={
                  <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => setDetailTarget(obj)}
                      leftIcon={<Eye className="w-4 h-4" aria-hidden="true" />}
                    >
                      Dettagli
                    </Button>
                    {revocable ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => setRevokeTarget(obj)}
                        leftIcon={<Undo2 className="w-4 h-4" aria-hidden="true" />}
                      >
                        Revoca
                      </Button>
                    ) : null}
                  </div>
                }
                ariaLabel={`Apri disponibilità ${obj.title}`}
              />
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Nuova disponibilità"
        footer={
          <div className="p-6 bg-gray-50">
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleCloseModal}
                className="flex-1"
                disabled={creating}
              >
                Annulla
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={creating || !form.title.trim() || form.imageUrls.length === 0}
                className="flex-1"
              >
                {creating ? 'Pubblicazione...' : 'Pubblica'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <EntityObjectForm
            idPrefix="create"
            imageKey={`create-${formKey}`}
            values={form}
            onChange={handleFormChange}
          >
            <div className="mt-2">
              <ShelfLabelScanner
                onScan={(location) =>
                  setForm((current) => ({ ...current, depositLocation: location }))
                }
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Il bene è già in giacenza: la posizione va indicata alla pubblicazione,
              non al momento della consegna.
            </p>
          </EntityObjectForm>
        </div>
      </Modal>

      {/* Dettagli + modifica disponibilità */}
      <EntityObjectDetailModal
        object={detailTarget}
        onClose={() => setDetailTarget(null)}
        onSaved={fetchObjects}
        onRevoke={(object) => setRevokeTarget(object)}
      />

      {/* Revoca disponibilità */}
      <Modal
        isOpen={revokeTarget !== null}
        onClose={() => !revoking && setRevokeTarget(null)}
        title="Revoca disponibilità"
        size="sm"
        zIndex={60}
        footer={
          <div className="p-6 bg-gray-50">
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setRevokeTarget(null)}
                className="flex-1"
                disabled={revoking}
              >
                Annulla
              </Button>
              <Button
                variant="danger"
                onClick={handleRevoke}
                className="flex-1"
                loading={revoking}
              >
                {revoking ? 'Revoca...' : 'Revoca'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700">
            Vuoi revocare la disponibilità{' '}
            <span className="font-semibold">{revokeTarget?.title}</span>?
          </p>
          <Alert type="warning" title="La disponibilità non sarà più visibile ai beneficiari.">
            <ul className="mt-2 space-y-1 list-disc pl-4">
              <li>L&apos;oggetto resta nel magazzino, ma non può più essere richiesto.</li>
              <li>
                La revoca è possibile solo se non ci sono richieste attive e l&apos;oggetto
                non è ancora stato consegnato.
              </li>
              <li>Potrai ripubblicarla dalla pagina &quot;Revocate&quot;.</li>
            </ul>
          </Alert>
        </div>
      </Modal>
    </div>
  );
}
