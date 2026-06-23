'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Inbox } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/types';
import { toast } from '@/components/ui/Toast';
import { Badge, Button, Checkbox, EmptyState, EntityListCard, Input, Select, Spinner } from '@/components/ui';

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
}

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponibile',
  RESERVED: 'Riservata',
  DEPOSITED: 'Depositata',
  CANCELLED: 'Cancellato',
  DONATED: 'Ritirato',
};

/**
 * Mappa Object.status → Badge variant KYKOS.
 * vedi: src/types/ObjectStatus per i 5 stati (AVAILABLE, RESERVED, DEPOSITED, DONATED, CANCELLED).
 */
function objectStatusBadge(status: string) {
  switch (status) {
    case 'AVAILABLE': return { variant: 'success' as const, label: 'Disponibile' };
    case 'RESERVED': return { variant: 'warning' as const, label: 'Riservata' };
    case 'DEPOSITED': return { variant: 'default' as const, label: 'Depositata' };
    case 'DONATED': return { variant: 'primary' as const, label: 'Ritirato' };
    case 'CANCELLED': return { variant: 'danger' as const, label: 'Cancellato' };
    default: return { variant: 'default' as const, label: status };
  }
}

export default function OperatorObjectsPage() {
  const [objects, setObjects] = useState<Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('AVAILABLE');
  const [showDonated, setShowDonated] = useState(false);

  useEffect(() => {
    fetchObjects();
  }, []);

  const fetchObjects = async () => {
    try {
      const res = await fetch('/api/operator/objects');
      const data = await res.json();
      setObjects(data.objects || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const filteredObjects = objects.filter(obj => {
    const matchesSearch = obj.title.toLowerCase().includes(search.toLowerCase()) ||
      (obj.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesCategory = !filterCategory || obj.category === filterCategory;
    if (obj.status === 'DONATED' && !showDonated) return false;
    const matchesStatus = !filterStatus || obj.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(objects.map(o => o.category))];
  const statuses = [...new Set(objects.map(o => o.status))].filter(s => s !== 'DONATED');

  const categoryOptions = [
    { value: '', label: 'Tutte' },
    ...categories.map(cat => ({
      value: cat,
      label: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat,
    })),
  ];

  const statusOptions = [
    { value: '', label: 'Tutti gli stati' },
    ...statuses.map(status => ({
      value: status,
      label: STATUS_LABELS[status] || status,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione disponibilità</h1>
          <p className="text-gray-500">{filteredObjects.length} oggetti</p>
        </div>
        <Checkbox
          label="Mostra donati"
          checked={showDonated}
          onChange={(e) => setShowDonated(e.target.checked)}
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col gap-4">
        <Input
          type="text"
          placeholder="Cerca per titolo o descrizione..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            options={categoryOptions}
            className="flex-1 min-w-[140px]"
          />
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={statusOptions}
            className="flex-1 min-w-[140px]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredObjects.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nessun oggetto"
          description="Non ci sono oggetti che corrispondono ai filtri."
        />
      ) : (
        <div className="space-y-4">
          {filteredObjects.map((obj) => {
            const statusBadge = objectStatusBadge(obj.status);
            return (
              <EntityListCard
                key={obj.id}
                href={`/operator/objects/${obj.id}`}
                onNavigate={() => sessionStorage.setItem('operatorListBackUrl', '/operator/objects')}
                icon={
                  obj.imageUrls && obj.imageUrls.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={obj.imageUrls[0]} alt={obj.title} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" aria-hidden="true" />
                  )
                }
                title={obj.title}
                badgesTop={<Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>}
                meta={
                  <>
                    {CATEGORY_LABELS[obj.category as keyof typeof CATEGORY_LABELS] || obj.category}
                    <span className="text-gray-400 ml-1">
                      ({CONDITION_LABELS[obj.condition as keyof typeof CONDITION_LABELS] || obj.condition})
                    </span>
                    <span className="mx-2 text-gray-300">•</span>
                    {formatDate(obj.createdAt)}
                  </>
                }
                footer={
                  obj.status === 'DEPOSITED' ? (
                    <Link href={`/operator/objects/${obj.id}/deliver`}>
                      <Button variant="success" size="sm" leftIcon={<Package className="h-4 w-4" aria-hidden="true" />}>
                        Conferma consegna
                      </Button>
                    </Link>
                  ) : undefined
                }
                ariaLabel={`Apri oggetto ${obj.title}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
