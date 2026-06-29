'use client';

import { useState, useEffect, useId } from 'react';
import { Package, SlidersHorizontal } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/types';
import { EntityListCard } from '@/components/ui';

interface Object {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  status: string;
  imageUrls: string[];
  createdAt: string;
  donor: { name: string };
  intermediary: { name: string };
}

export default function DioceseObjectsPage() {
  const [objects, setObjects] = useState<Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFiltersCount =
    (search ? 1 : 0) +
    (filterCategory ? 1 : 0);

  const filtersButtonId = useId();
  const filtersPanelId = useId();

  useEffect(() => {
    fetchObjects();
  }, []);

  const fetchObjects = async () => {
    try {
      const res = await fetch('/api/operator/diocese-objects');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore nel caricamento');
      }
      const data = await res.json();
      // Filter only AVAILABLE objects
      setObjects((data.objects || []).filter((o: Object) => o.status === 'AVAILABLE'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore generico');
    } finally {
      setLoading(false);
    }
  };

  const filteredObjects = objects.filter(obj => {
    const matchesSearch = obj.title.toLowerCase().includes(search.toLowerCase()) ||
      (obj.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesCategory = !filterCategory || obj.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(objects.map(o => o.category))];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-error-600 mb-4">{error}</p>
        <button onClick={() => { setError(null); setLoading(true); fetchObjects(); }} className="text-sm text-primary-600 hover:underline">
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disponibilità diocesi</h1>
          <p className="text-gray-500">{filteredObjects.length} oggetti disponibili</p>
        </div>

        {/* Bottone toggle pannello filtri */}
        <button
          id={filtersButtonId}
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          aria-controls={filtersPanelId}
          aria-label={
            filtersOpen
              ? 'Chiudi filtri'
              : activeFiltersCount > 0
                ? `Apri filtri (${activeFiltersCount} attiv${activeFiltersCount === 1 ? 'o' : 'i'})`
                : 'Apri filtri'
          }
          className={cn(
            'relative inline-flex items-center justify-center self-start sm:self-auto',
            'min-h-[44px] min-w-[44px] -m-2 p-2',
            'rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
            'transition-colors',
          )}
        >
          <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
          {activeFiltersCount > 0 && (
            <>
              <span
                className={cn(
                  'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1',
                  'bg-error-500 text-white text-[10px] font-bold',
                  'rounded-full inline-flex items-center justify-center',
                  'ring-2 ring-white',
                )}
                aria-hidden="true"
              >
                {activeFiltersCount}
              </span>
              <span className="sr-only">{activeFiltersCount} filtri attivi</span>
            </>
          )}
        </button>
      </div>

      {/* Pannello filtri collassabile */}
      {filtersOpen && (
        <div
          id={filtersPanelId}
          role="region"
          aria-labelledby={filtersButtonId}
          className="bg-white p-4 rounded-xl shadow-sm border flex flex-col gap-4"
        >
          <input
            type="text"
            placeholder="Cerca per titolo o descrizione..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="flex-1 min-w-[140px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Tutte le categorie</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {filteredObjects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessun oggetto</h2>
          <p className="text-gray-500">Non ci sono oggetti che corrispondono ai filtri.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredObjects.map((obj) => (
            <EntityListCard
              key={obj.id}
              href={`/operator/objects/${obj.id}`}
              onNavigate={() => sessionStorage.setItem('operatorListBackUrl', '/operator/diocese-objects')}
              icon={
                obj.imageUrls && obj.imageUrls.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={obj.imageUrls[0]} alt={obj.title} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" aria-hidden="true" />
                )
              }
              title={obj.title}
              meta={
                <>
                  {CATEGORY_LABELS[obj.category as keyof typeof CATEGORY_LABELS] || obj.category}
                  <span className="text-gray-400 ml-1">
                    ({CONDITION_LABELS[obj.condition as keyof typeof CONDITION_LABELS] || obj.condition})
                  </span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-gray-400">Ente:</span> {obj.intermediary.name}
                  <span className="mx-2 text-gray-300">•</span>
                  {formatDate(obj.createdAt)}
                </>
              }
              ariaLabel={`Apri oggetto ${obj.title}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}