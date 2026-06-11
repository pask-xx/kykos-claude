'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Plus } from 'lucide-react';
import { OBJECT_STATUS_LABELS } from '@/types';
import { toast } from '@/components/ui/Toast';
import { Badge, Button, EmptyState, Spinner, Tabs } from '@/components/ui';
import {
  ExpandableObjectCard,
  type ExpandableObjectCardObject,
} from '@/components/recipient/ExpandableObjectCard';
import { DonorImageLightbox } from '@/components/donor/DonorImageLightbox';

type ObjectFilter = 'available' | 'all';

export default function DonorObjectsPage() {
  const [objects, setObjects] = useState<ExpandableObjectCardObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ObjectFilter>('available');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Lightbox state (unico a livello pagina, pattern riusato da /recipient/objects)
  const [lightboxImage, setLightboxImage] = useState<
    { url: string; title: string; index: number } | null
  >(null);

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
    try {
      const res = await fetch(`/api/donor/objects/${objectId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // Rimuovi l'oggetto cancellato dalla lista (ottimistico)
        setObjects((prev) => prev.filter((o) => o.id !== objectId));
        setExpandedId((current) => (current === objectId ? null : current));
        toast.success('Disponibilità cancellata');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Errore nella cancellazione');
      }
    } catch {
      toast.error('Errore di connessione');
    }
  };

  const handleImageClick = (objectId: string, index: number) => {
    const obj = objects.find((o) => o.id === objectId);
    if (obj?.imageUrls && obj.imageUrls[index]) {
      setLightboxImage({ url: obj.imageUrls[index], title: obj.title, index });
    }
  };

  const availableCount = objects.filter((obj) => obj.status === 'AVAILABLE').length;
  const filteredObjects = filter === 'available'
    ? objects.filter((obj) => obj.status === 'AVAILABLE')
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

        <div className="mt-4">
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
            <div className="space-y-3">
              {filteredObjects.map((obj) => (
                <ExpandableObjectCard
                  key={obj.id}
                  object={obj}
                  isExpanded={expandedId === obj.id}
                  onToggle={() =>
                    setExpandedId(expandedId === obj.id ? null : obj.id)
                  }
                  // Donor browsing dei propri oggetti: niente Richiedi/Segnala/Messaggio.
                  showRequestButton={false}
                  showReportButton={false}
                  showRequestMessageInput={false}
                  // Conteggio richieste ricevute (es. "3 richieste" su card collassata).
                  showRequestCount={true}
                  // Link di dettaglio verso la pagina donor (NON recipient — anonymity).
                  detailHref={(id) => `/donor/objects/${id}`}
                  // Bottone "Cancella disponibilità" solo su oggetti AVAILABLE.
                  onCancel={obj.status === 'AVAILABLE' ? handleCancel : undefined}
                  // Apertura lightbox al click su immagine galleria.
                  onImageClick={handleImageClick}
                  // Badge status nel dettaglio espanso.
                  extraInfo={
                    <Badge variant="default" size="sm">
                      {OBJECT_STATUS_LABELS[obj.status as keyof typeof OBJECT_STATUS_LABELS] ?? obj.status}
                    </Badge>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <DonorImageLightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
}
