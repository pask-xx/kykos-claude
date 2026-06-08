'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Plus, Inbox } from 'lucide-react';
import { CATEGORY_LABELS, OBJECT_STATUS_LABELS } from '@/types';
import { toast } from '@/components/ui/Toast';
import { Badge, Button, EmptyState, Spinner } from '@/components/ui';

interface Object {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  status: string;
  imageUrls: string[] | null;
  createdAt: string;
}

/**
 * Mappa Object.status → Badge variant KYKOS.
 * vedi: src/types/ObjectStatus.
 */
function objectStatusBadge(status: string) {
  switch (status) {
    case 'AVAILABLE': return { variant: 'success' as const, label: OBJECT_STATUS_LABELS[status as keyof typeof OBJECT_STATUS_LABELS] ?? 'Disponibile' };
    case 'RESERVED': return { variant: 'warning' as const, label: OBJECT_STATUS_LABELS[status as keyof typeof OBJECT_STATUS_LABELS] ?? 'Riservato' };
    case 'DEPOSITED': return { variant: 'primary' as const, label: OBJECT_STATUS_LABELS[status as keyof typeof OBJECT_STATUS_LABELS] ?? 'Depositato' };
    case 'DONATED': return { variant: 'default' as const, label: OBJECT_STATUS_LABELS[status as keyof typeof OBJECT_STATUS_LABELS] ?? 'Donato' };
    case 'CANCELLED': return { variant: 'danger' as const, label: OBJECT_STATUS_LABELS[status as keyof typeof OBJECT_STATUS_LABELS] ?? 'Cancellato' };
    case 'BLOCKED': return { variant: 'warning' as const, label: OBJECT_STATUS_LABELS[status as keyof typeof OBJECT_STATUS_LABELS] ?? 'Bloccato' };
    default: return { variant: 'default' as const, label: status };
  }
}

export default function RecipientMyObjectsPage() {
  const [objects, setObjects] = useState<Object[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Le mie disponibilità</h1>
          <Link href="/recipient/my-objects/new">
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
              Aggiungi disponibilità
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : objects.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Nessuna disponibilità"
            description="Non hai ancora pubblicato disponibilità da donare."
            action={
              <Link href="/recipient/my-objects/new">
                <Button variant="primary">
                  <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                  Pubblica il tuo primo oggetto
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {objects.map((obj) => {
              const statusBadge = objectStatusBadge(obj.status);
              return (
                <div key={obj.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {obj.imageUrls && obj.imageUrls[0] ? (
                      <img src={obj.imageUrls[0]} alt={obj.title} className="object-cover w-full h-full" />
                    ) : (
                      <Package className="h-16 w-16 text-gray-400" aria-hidden="true" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                      <Badge variant="default" size="sm">
                        {CATEGORY_LABELS[obj.category as keyof typeof CATEGORY_LABELS] || obj.category.replace('_', ' ')}
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
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
