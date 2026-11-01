'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, History, Package, Truck } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/types';
import { toast } from '@/components/ui/Toast';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  EntityListCard,
  Input,
  Select,
  Spinner,
  StatCard,
} from '@/components/ui';
import {
  ENTITY_HISTORY_PERIODS,
  filterEntityHistory,
  groupEntityHistoryByDate,
  type EntityHistoryItem,
  type EntityHistoryPeriod,
} from '@/lib/entity-history';

/**
 * Storico delle disponibilità del magazzino consegnate ai beneficiari.
 *
 * Le consegnate NON compaiono più nella pagina Magazzino: qui sono
 * elencate per data di consegna, con strumenti di ricerca (testo,
 * periodo, categoria).
 *
 * **Anonymity**: la pagina NON mostra né il donatore né il beneficiario
 * (l'ente è il donatore: per la tabella di visibilità KYKOS non vede mai
 * il nome del beneficiario). Nessun dato della controparte viene
 * selezionato dall'API.
 */
export default function EntityHistoryPage() {
  const [items, setItems] = useState<EntityHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [truncated, setTruncated] = useState(false);

  // Filtri
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<EntityHistoryPeriod>('ALL');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/operator/entity-objects?status=DONATED');
      if (res.ok) {
        const data = await res.json();
        setItems(data.objects || []);
        setTruncated(Boolean(data.truncated));
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

  const filtered = useMemo(
    () =>
      filterEntityHistory(items, {
        search,
        period,
        category: category || null,
      }),
    [items, search, period, category]
  );

  const groups = useMemo(() => groupEntityHistoryByDate(filtered), [filtered]);

  const last30 = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 0, 0, 0, 0);
    return items.filter((item) => new Date(item.deliveredAt).getTime() >= from.getTime()).length;
  }, [items]);

  const categoryOptions = useMemo(() => {
    const categories = [...new Set(items.map((item) => item.category))];
    return [
      { value: '', label: 'Tutte le categorie' },
      ...categories.map((cat) => ({
        value: cat,
        label: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat,
      })),
    ];
  }, [items]);

  const periodOptions = ENTITY_HISTORY_PERIODS.map((option) => ({
    value: option.value,
    label: option.label,
  }));

  const hasFilters = search.trim().length > 0 || period !== 'ALL' || category !== '';

  const resetFilters = () => {
    setSearch('');
    setPeriod('ALL');
    setCategory('');
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
        <h1 className="text-2xl font-bold text-gray-900">Storico consegne</h1>
        <p className="text-gray-500">
          Le disponibilità del magazzino già consegnate ai beneficiari
        </p>
      </div>

      {!loading && items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={Truck}
            label="Consegne totali"
            value={items.length}
            tone="primary"
            ariaLabel={`Consegne totali: ${items.length}`}
          />
          <StatCard
            icon={History}
            label="Ultimi 30 giorni"
            value={last30}
            tone="success"
            ariaLabel={`Consegne ultimi 30 giorni: ${last30}`}
          />
          <StatCard
            icon={Package}
            label="Risultati filtri"
            value={filtered.length}
            tone="info"
            ariaLabel={`Risultati dei filtri: ${filtered.length}`}
          />
        </div>
      )}

      {/* Strumenti di ricerca */}
      <Card variant="bordered" padding="md">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            type="search"
            label="Cerca nello storico"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Titolo, descrizione, posizione..."
          />
          <Select
            label="Periodo"
            value={period}
            onChange={(e) => setPeriod(e.target.value as EntityHistoryPeriod)}
            options={periodOptions}
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

      {truncated && (
        <p className="text-sm text-gray-500">
          Sono mostrate le consegne più recenti. Per lo storico completo usa i filtri.
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Nessuna consegna registrata"
          description="Le disponibilità consegnate ai beneficiari compariranno qui, raggruppate per data."
        />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nessun risultato"
          description="Nessuna consegna corrisponde ai filtri selezionati."
          action={
            <Button variant="secondary" onClick={resetFilters}>
              Azzera filtri
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.dateKey} aria-labelledby={`group-${group.dateKey}`}>
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h2
                  id={`group-${group.dateKey}`}
                  className="text-lg font-semibold text-gray-900 capitalize"
                >
                  {group.label}
                </h2>
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  {group.items.length === 1
                    ? '1 consegna'
                    : `${group.items.length} consegne`}
                </span>
              </div>
              <div className="grid gap-4">
                {group.items.map((item) => (
                  <EntityListCard
                    key={item.id}
                    icon={
                      item.imageUrls && item.imageUrls.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrls[0]}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" aria-hidden="true" />
                      )
                    }
                    title={item.title}
                    badgesTop={
                      <>
                        <Badge variant="success" pill>
                          Consegnato
                        </Badge>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatDate(item.deliveredAt)}
                        </span>
                      </>
                    }
                    description={item.description ?? undefined}
                    meta={
                      <>
                        <span className="text-gray-500">
                          {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] ||
                            item.category}
                        </span>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="text-gray-500">
                          {CONDITION_LABELS[item.condition as keyof typeof CONDITION_LABELS] ||
                            item.condition}
                        </span>
                        {item.depositLocation ? (
                          <>
                            <span className="mx-2 text-gray-300">•</span>
                            <span className="text-gray-500">{item.depositLocation}</span>
                          </>
                        ) : null}
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="text-gray-500">
                          Pubblicato il {formatDate(item.createdAt)}
                        </span>
                      </>
                    }
                    ariaLabel={`Disponibilità consegnata ${item.title}`}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
