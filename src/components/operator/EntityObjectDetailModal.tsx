'use client';

import { ReactNode, useEffect, useState } from 'react';
import { toast } from '@/components/ui/Toast';
import { Button, Modal } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { CATEGORY_LABELS, CONDITION_LABELS, type Category, type Condition, type ObjectStatus } from '@/types';
import { canEditEntityObject, canRevokeEntityObject } from '@/lib/entity-object-rules';
import {
  EMPTY_ENTITY_OBJECT_FORM,
  EntityObjectForm,
  type EntityObjectFormValues,
} from './EntityObjectForm';
import { EntityObjectStatusBadge } from './EntityObjectStatusBadge';
import { ShelfLabelScanner } from './ShelfLabelScanner';

/**
 * Modale di dettaglio di una disponibilità dell'ente.
 *
 * Mostra tutti i dati della pubblicazione (galleria completa, descrizione,
 * posizione di deposito, date) e permette di MODIFICARE la pubblicazione
 * finché l'oggetto non è ancora stato consegnato.
 *
 * **Accessibilità**: nessun `<div onClick>` — l'apertura avviene da un
 * bottone `<Button>` sulla card, la modale è la primitive `<Modal>`.
 *
 * **Anonymity**: nessun dato di donatore o beneficiario viene mostrato
 * (l'ente è il donatore: non vede mai la controparte).
 */

export interface EntityObjectDetail {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  condition: Condition;
  imageUrls: string[] | null;
  status: ObjectStatus;
  depositLocation: string | null;
  depositNotes: string | null;
  createdAt: string;
  updatedAt: string;
  /** Data di consegna (solo per le consegnate). */
  deliveredAt?: string | null;
  _count?: { requests: number };
}

export interface EntityObjectDetailModalProps {
  /** Oggetto aperto: `null` = modale chiusa. */
  object: EntityObjectDetail | null;
  onClose: () => void;
  /** Callback dopo una modifica salvata (serve a ricaricare la lista). */
  onSaved: () => void;
  /** Callback per la revoca (il parent gestisce la conferma). */
  onRevoke?: (object: EntityObjectDetail) => void;
  /** Slot extra nel footer (modo visualizzazione). */
  footerExtra?: ReactNode;
}

function toFormValues(object: EntityObjectDetail): EntityObjectFormValues {
  return {
    title: object.title,
    description: object.description ?? '',
    category: object.category,
    condition: object.condition,
    imageUrls: object.imageUrls ?? [],
    depositLocation: object.depositLocation ?? '',
    depositNotes: object.depositNotes ?? '',
  };
}

export function EntityObjectDetailModal({
  object,
  onClose,
  onSaved,
  onRevoke,
  footerExtra,
}: EntityObjectDetailModalProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [form, setForm] = useState<EntityObjectFormValues>(EMPTY_ENTITY_OBJECT_FORM);
  const [saving, setSaving] = useState(false);

  // Cambiando oggetto (o ricaricandolo dopo un salvataggio) si torna
  // alla visualizzazione con i valori aggiornati.
  useEffect(() => {
    setMode('view');
    setForm(object ? toFormValues(object) : EMPTY_ENTITY_OBJECT_FORM);
  }, [object]);

  if (!object) return null;

  const editable = canEditEntityObject(object.status);
  const revocable = canRevokeEntityObject(object.status, object._count?.requests ?? 0);
  const photos = object.imageUrls ?? [];
  // La data di consegna ha un fallback su `updatedAt`: ha senso mostrarla
  // solo per le disponibilità davvero consegnate.
  const delivered = object.status === 'DONATED' ? object.deliveredAt : null;

  const handleChange = (patch: Partial<EntityObjectFormValues>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/operator/entity-objects/${object.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          data: {
            ...form,
            description: form.description.trim() || null,
            depositLocation: form.depositLocation.trim() || null,
            depositNotes: form.depositNotes.trim() || null,
          },
        }),
      });

      if (res.ok) {
        toast.success('Disponibilità aggiornata');
        setMode('view');
        onSaved();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Errore durante la modifica');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Errore di connessione');
    } finally {
      setSaving(false);
    }
  };

  const footer =
    mode === 'edit' ? (
      <div className="p-6 bg-gray-50">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              setForm(toFormValues(object));
              setMode('view');
            }}
            disabled={saving}
          >
            Annulla
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSave}
            loading={saving}
            disabled={!form.title.trim() || form.imageUrls.length === 0}
          >
            {saving ? 'Salvataggio...' : 'Salva modifiche'}
          </Button>
        </div>
      </div>
    ) : (
      <div className="p-6 bg-gray-50">
        <div className="flex flex-wrap justify-end gap-3">
          {footerExtra}
          {onRevoke && revocable && (
            <Button variant="secondary" onClick={() => onRevoke(object)}>
              Revoca
            </Button>
          )}
          {editable && (
            <Button variant="primary" onClick={() => setMode('edit')}>
              Modifica
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Chiudi
          </Button>
        </div>
      </div>
    );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={mode === 'edit' ? 'Modifica disponibilità' : 'Dettagli disponibilità'}
      size="lg"
      footer={footer}
    >
      <div className="p-6 space-y-5">
        {mode === 'view' ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <EntityObjectStatusBadge status={object.status} />
              <span className="text-sm text-gray-500">
                Pubblicata il {formatDate(object.createdAt)}
              </span>
              {delivered && (
                <span className="text-sm text-gray-500">
                  · Consegnata il {formatDate(delivered)}
                </span>
              )}
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((url, index) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt={`${object.title} - foto ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                ))}
              </div>
            )}

            {object.description && (
              <p className="text-sm text-gray-700 whitespace-pre-line">{object.description}</p>
            )}

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Categoria</dt>
                <dd className="font-medium text-gray-900">
                  {CATEGORY_LABELS[object.category] ?? object.category}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Condizione</dt>
                <dd className="font-medium text-gray-900">
                  {CONDITION_LABELS[object.condition] ?? object.condition}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Posizione di deposito</dt>
                <dd className="font-medium text-gray-900">
                  {object.depositLocation || 'Non indicata'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Richieste attive</dt>
                <dd className="font-medium text-gray-900">{object._count?.requests ?? 0}</dd>
              </div>
              {object.depositNotes && (
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">Note di deposito</dt>
                  <dd className="font-medium text-gray-900">{object.depositNotes}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Ultima modifica</dt>
                <dd className="font-medium text-gray-900">{formatDate(object.updatedAt)}</dd>
              </div>
            </dl>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500">
              Le modifiche sono visibili subito ai beneficiari che vedono la disponibilità.
            </p>
            <EntityObjectForm
              idPrefix="edit"
              imageKey={object.id}
              values={form}
              onChange={handleChange}
            >
              <div className="mt-2">
                <ShelfLabelScanner
                  onScan={(location) => handleChange({ depositLocation: location })}
                />
              </div>
            </EntityObjectForm>
          </>
        )}
      </div>
    </Modal>
  );
}
