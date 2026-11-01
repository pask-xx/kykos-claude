'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Ban, ChevronLeft, Eye, Package, RotateCcw } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { canRepublishEntityObject } from '@/lib/entity-object-rules';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/types';
import { toast } from '@/components/ui/Toast';
import { Button, Card, EmptyState, EntityListCard, Input, Select, Spinner } from '@/components/ui';
import {
  EntityObjectDetailModal,
  type EntityObjectDetail,
} from '@/components/operator/EntityObjectDetailModal';
import { EntityObjectStatusBadge } from '@/components/operator/EntityObjectStatusBadge';

/**
 * Disponibilità revocate dal magazzino dell'ente.
 *
 * Le revocate non compaiono nella pagina Magazzino: qui l'ente le
 * ritrova e può ripubblicarle (CANCELLED → AVAILABLE), tornando a
 * renderle disponibili ai beneficiari.
 *
 * **Anonymity**: nessun dato di donatore o beneficiario viene mostrato
 * o richiesto (l'ente è il donatore: non vede mai la controparte).
 */
export default function EntityRevokedPage() {
  const [objects, setObjects] = useState<EntityObjectDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailTarget, setDetailTarget] = useState<EntityObjectDetail | null>(null);
  const [republishingId, setRepublishingId] = useState<string | null>(null);

  // Filtri
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchObjects();
  }, []);

  const fetchObjects = async () => {
    try {
      const res = await fetch('/api/operator/entity-objects?status=CANCELLED');
      if (res.ok) {
        const data = await res.json();
        const next: EntityObjectDetail[] = data.objects || [];
        setObjects(next);
        // Allinea la modale aperta alla lista appena ricaricata.
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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return objects.filter((object) => {
      if (category && object.category !== category) return false;
      if (!term) return true;

      const haystack = [object.title, object.description ?? '', object.depositLocation ?? '']
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [objects, search, category]);

  const categoryOptions = useMemo(() => {
    const categories = [...new Set(objects.map((object) => object.category))];
    return [
      { value: '', label: 'Tutte le categorie' },
      ...categories.map((cat) => ({
        value: cat,
        label: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat,
      })),
    ];
  }, [objects]);

  const hasFilters = search.trim().length > 0 || category !== '';

  const resetFilters = () => {
    setSearch('');
    setCategory('');
  };

  const handleRepublish = async (object: EntityObjectDetail) => {
    setRepublishingId(object.id);
    try {
      const res = await fetch(`/api/operator/entity-objects/${object.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'republish' }),
      });

      if (res.ok) {
        setDetailTarget(null);
        await fetchObjects();
        toast.success('Disponibilità ripubblicata');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Errore durante la ripubblicazione');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Errore di connessione');
    } finally {
      setRepublishingId(null);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <Link
          href="/operator/entity-availability"
          className="text-sm text-gray-500 hover:text-primary-600 mb-2 inline-flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          Torna al magazzino
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Revocate</h1>
        <p className="text-gray-500">
          Disponibilità ritirate dalla circolazione: puoi ripubblicarle
        </p>
      </div>

      {/* Strumenti di ricerca */}
      <Card variant="bordered" padding="md">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="search"
            label="Cerca tra le revocate"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Titolo, descrizione, posizione..."
          />
          <Select
            label="Categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={categoryOptions}
          />
        </div>
        {hasFilters && (
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Azzera filtri
            </Button>
          </div>
        )}
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : objects.length === 0 ? (
        <EmptyState
          icon={Ban}
          title="Nessuna disponibilità revocata"
          description="Le disponibilità che revochi dal magazzino compariranno qui."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nessun risultato"
          description="Nessuna disponibilità revocata corrisponde ai filtri selezionati."
          action={
            <Button variant="secondary" onClick={resetFilters}>
              Azzera filtri
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {filtered.map((obj) => (
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
                  {canRepublishEntityObject(obj.status) && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => handleRepublish(obj)}
                      loading={republishingId === obj.id}
                      leftIcon={<RotateCcw className="w-4 h-4" aria-hidden="true" />}
                    >
                      Ripubblica
                    </Button>
                  )}
                </div>
              }
              ariaLabel={`Disponibilità revocata ${obj.title}`}
            />
          ))}
        </div>
      )}

      {/* Dettagli disponibilità revocata */}
      <EntityObjectDetailModal
        object={detailTarget}
        onClose={() => setDetailTarget(null)}
        onSaved={fetchObjects}
        footerExtra={
          detailTarget && canRepublishEntityObject(detailTarget.status) ? (
            <Button
              variant="primary"
              onClick={() => handleRepublish(detailTarget)}
              loading={republishingId === detailTarget.id}
              leftIcon={<RotateCcw className="w-4 h-4" aria-hidden="true" />}
            >
              Ripubblica
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
