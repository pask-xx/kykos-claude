'use client';

import { useState, useEffect, useId } from 'react';
import { Package } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { CATEGORY_LABELS, Category } from '@/types';
import { toast } from '@/components/ui/Toast';
import { Badge, Button, EmptyState, EntityListCard, Input, Modal, Spinner, Textarea } from '@/components/ui';
import ImageUploader from '@/components/ImageUploader';

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
  createdAt: string;
  _count?: {
    requests: number;
  };
}

const categoryOptions = (Object.entries(CATEGORY_LABELS) as [Category, string][]).map(
  ([value, label]) => ({ value, label })
);

/**
 * Mappa MultiAvailability.status → Badge variant KYKOS.
 * vedi: src/types/MultiAvailabilityStatus per i 3 stati.
 */
function availabilityStatusBadge(status: string) {
  switch (status) {
    case 'OPEN': return { variant: 'success' as const, label: 'Aperta' };
    case 'CLOSED': return { variant: 'default' as const, label: 'Chiusa' };
    case 'EXHAUSTED': return { variant: 'danger' as const, label: 'Esaurita' };
    default: return { variant: 'default' as const, label: status };
  }
}

export default function MultiAvailabilityPage() {
  const [availabilities, setAvailabilities] = useState<MultiAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const categoryId = useId();
  const photoId = useId();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('OTHER');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
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
          imageUrls,
          availableQty: parseInt(availableQty.toString()),
          deadline: deadline || null,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchAvailabilities();
        toast.success('Distribuzione creata con successo');
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
    setTitle('');
    setDescription('');
    setCategory('OTHER');
    setImageUrls([]);
    setAvailableQty(10);
    setDeadline('');
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Distribuzione</h1>
          <p className="text-gray-500">Gestisci offerte con assegnazione manuale</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          + Nuova distribuzione
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : availabilities.length === 0 ? (
        <EmptyState
          title="Nessuna distribuzione"
          description="Crea la tua prima disponibilità"
        />
      ) : (
        <div className="grid gap-4">
          {availabilities.map((avail) => {
            const statusBadge = availabilityStatusBadge(avail.status);
            return (
              <EntityListCard
                key={avail.id}
                href={`/operator/availability/${avail.id}`}
                icon={
                  avail.imageUrls && avail.imageUrls.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avail.imageUrls[0]}
                      alt={avail.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" aria-hidden="true" />
                  )
                }
                title={avail.title}
                badgesTop={
                  <>
                    <Badge variant={statusBadge.variant} pill>
                      {statusBadge.label}
                    </Badge>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(avail.createdAt)}
                    </span>
                  </>
                }
                description={avail.description ?? undefined}
                meta={
                  <>
                    <span className="text-gray-500">
                      {CATEGORY_LABELS[avail.category]}
                    </span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="font-medium text-gray-700">
                      {avail.assignedQty}/{avail.availableQty} assegnati
                    </span>
                    {avail._count?.requests ? (
                      <>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="text-gray-500">
                          {avail._count.requests} {avail._count.requests === 1 ? 'richiesta pendente' : 'richieste pendenti'}
                        </span>
                      </>
                    ) : null}
                  </>
                }
                ariaLabel={`Apri distribuzione ${avail.title}`}
              />
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nuova distribuzione"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              className="flex-1"
              disabled={creating}
            >
              Annulla
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={creating || !title || availableQty < 1}
              className="flex-1"
            >
              {creating ? 'Creazione...' : 'Crea'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            type="text"
            label="Titolo *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Es. Pacchi alimentari"
          />

          <Textarea
            label="Descrizione"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Dettagli sulla disponibilità..."
          />

          <div>
            <label htmlFor={categoryId} className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
            <select
              id={categoryId}
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              {categoryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <span id={photoId} className="block text-sm font-medium text-gray-700 mb-1">Foto</span>
            <div aria-labelledby={photoId}>
              <ImageUploader
                onImagesChange={setImageUrls}
                maxFiles={5}
                currentImages={imageUrls}
              />
            </div>
          </div>

          <Input
            type="number"
            label="Quantità disponibile *"
            min="1"
            value={availableQty}
            onChange={(e) => setAvailableQty(parseInt(e.target.value) || 1)}
          />

          <Input
            type="datetime-local"
            label="Scadenza (opzionale)"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
