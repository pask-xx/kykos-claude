'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Plus, Inbox } from 'lucide-react';
import { CATEGORY_LABELS, OBJECT_STATUS_LABELS } from '@/types';
import { toast } from '@/components/ui/Toast';
import { Card, EmptyState, Spinner, Badge, Button } from '@/components/ui';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ExpandableObjectCard } from '@/components/recipient/ExpandableObjectCard';

interface Object {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  status: string;
  imageUrls: string[] | null;
  createdAt: string;
  depositLocation?: string | null;
  _count?: { requests: number };
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

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

  const handleCancel = async (objectId: string) => {
    setCancelling(objectId);
    try {
      const res = await fetch(`/api/donor/objects/${objectId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Disponibilità cancellata');
        fetchObjects();
        setExpandedId(null);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Errore nella cancellazione');
      }
    } catch {
      toast.error('Errore di connessione');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <Card variant="bordered" padding="md" className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Le mie disponibilità</h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestisci gli oggetti che hai pubblicato per la donazione.
              </p>
            </div>
            <Link href="/recipient/my-objects/new">
              <Button variant="primary">
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                Aggiungi disponibilità
              </Button>
            </Link>
          </div>
        </Card>

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
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              {objects.length} {objects.length === 1 ? 'disponibilità' : 'disponibilità'}
            </p>
            {objects.map((obj) => {
              const statusBadge = objectStatusBadge(obj.status);
              return (
                <div key={obj.id}>
                  <ExpandableObjectCard
                    object={{
                      id: obj.id,
                      title: obj.title,
                      description: obj.description,
                      category: obj.category,
                      condition: obj.condition,
                      imageUrls: obj.imageUrls,
                      status: obj.status,
                      createdAt: obj.createdAt,
                      _count: obj._count,
                    }}
                    // NO `level`: my-objects non mostra livello donatore verso sé stesso
                    isExpanded={expandedId === obj.id}
                    onToggle={() => setExpandedId(expandedId === obj.id ? null : obj.id)}
                    // NIENTE Richiedi, Segnala, Message input
                    showRequestButton={false}
                    showReportButton={false}
                    showRequestMessageInput={false}
                    showRequestCount={true}
                    // Bottone Cancella solo se AVAILABLE
                    onCancel={obj.status === 'AVAILABLE' ? handleCancel : undefined}
                    // Link a /recipient/objects/[id] (MAI /donor/* per anonymity)
                    showDetailLink={true}
                    extraInfo={
                      <div className="flex items-center gap-2">
                        <Badge variant={statusBadge.variant} size="sm">
                          {statusBadge.label}
                        </Badge>
                      </div>
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
