'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Plus } from 'lucide-react';
import { OBJECT_STATUS_LABELS } from '@/types';
import { toast } from '@/components/ui/Toast';
import { Badge, Button, EmptyState, Spinner, Tabs } from '@/components/ui';

interface Object {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  status: string;
  imageUrls: string[];
  createdAt: string;
}

type ObjectFilter = 'available' | 'all';

/**
 * Mappa Object.status → Badge variant KYKOS.
 * vedi: src/types/ObjectStatus per i 6 stati (AVAILABLE, RESERVED, DEPOSITED, DONATED, CANCELLED, BLOCKED).
 */
function objectStatusBadge(status: string) {
  switch (status) {
    case 'AVAILABLE': return { variant: 'success' as const, label: 'Disponibile' };
    case 'RESERVED': return { variant: 'info' as const, label: 'Riservata' };
    case 'DEPOSITED': return { variant: 'primary' as const, label: 'Depositata' };
    case 'DONATED': return { variant: 'default' as const, label: 'Donata' };
    case 'CANCELLED': return { variant: 'danger' as const, label: 'Annullata' };
    case 'BLOCKED': return { variant: 'warning' as const, label: 'Bloccata' };
    default: return { variant: 'default' as const, label: OBJECT_STATUS_LABELS[status as keyof typeof OBJECT_STATUS_LABELS] ?? status };
  }
}

export default function DonorObjectsPage() {
  const [objects, setObjects] = useState<Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ObjectFilter>('available');

  useEffect(() => {
    fetchObjects();
  }, []);

  const fetchObjects = async () => {
    try {
      const res = await fetch('/api/donor/objects');
      const data = await res.json();
      setObjects(data.objects || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const availableCount = objects.filter((obj) => obj.status === 'AVAILABLE').length;
  const filteredObjects = filter === 'available'
    ? objects.filter(obj => obj.status === 'AVAILABLE')
    : objects;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Le mie disponibilità</h1>
          <Link href="/donor/objects/new">
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
              Nuovo oggetto
            </Button>
          </Link>
        </div>

        <Tabs<ObjectFilter>
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'available', label: 'Disponibili', count: availableCount },
            { value: 'all', label: 'Tutti', count: objects.length },
          ]}
          variant="default"
          ariaLabel="Filtra oggetti per disponibilità"
        />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredObjects.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nessuna disponibilità"
          description={
            filter === 'available'
              ? 'Non hai oggetti disponibili al momento.'
              : 'Non hai ancora pubblicato disponibilità.'
          }
          action={
            filter === 'all' ? (
              <Link href="/donor/objects/new">
                <Button variant="primary">Pubblica il tuo primo oggetto</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredObjects.map((obj) => {
            const statusBadge = objectStatusBadge(obj.status);
            return (
              <Link
                key={obj.id}
                href={`/donor/objects/${obj.id}`}
                className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {obj.imageUrls && obj.imageUrls.length > 0 ? (
                    <img src={obj.imageUrls[0]} alt={obj.title} className="object-cover w-full h-full" />
                  ) : (
                    <Package className="h-16 w-16 text-gray-400" aria-hidden="true" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <Badge variant="default" size="sm">
                      {obj.category.replace('_', ' ')}
                    </Badge>
                    <Badge variant={statusBadge.variant} size="sm">
                      {statusBadge.label}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{obj.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {obj.description || 'Nessuna descrizione'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      </main>
    </div>
  );
}
