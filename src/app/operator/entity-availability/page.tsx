'use client';

import { useState, useEffect, useRef, useId, useCallback } from 'react';
import { Package, QrCode, Camera } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { formatDate } from '@/lib/utils';
import { formatShelfLocation } from '@/lib/shelf-label';
import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  OBJECT_STATUS_LABELS,
  type Category,
  type Condition,
  type ObjectStatus,
} from '@/types';
import { toast } from '@/components/ui/Toast';
import { Badge, Button, EmptyState, EntityListCard, Input, Modal, Select, Spinner, Textarea } from '@/components/ui';
import ImageUploader from '@/components/ImageUploader';

interface EntityObject {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  condition: Condition;
  imageUrls: string[];
  status: ObjectStatus;
  depositLocation: string | null;
  depositNotes: string | null;
  createdAt: string;
  _count?: { requests: number };
}

const categoryOptions = (Object.entries(CATEGORY_LABELS) as [Category, string][]).map(
  ([value, label]) => ({ value, label })
);

const conditionOptions = (Object.entries(CONDITION_LABELS) as [Condition, string][]).map(
  ([value, label]) => ({ value, label })
);

/**
 * Mappa Object.status → Badge variant KYKOS.
 * Per le disponibilità dell'ente "DEPOSITED" significa "in giacenza in sede,
 * in attesa che il beneficiario ritiri" (non "depositato da un donatore").
 */
function objectStatusBadge(status: ObjectStatus) {
  switch (status) {
    case 'AVAILABLE':
      return { variant: 'success' as const, label: OBJECT_STATUS_LABELS.AVAILABLE };
    case 'RESERVED':
      return { variant: 'info' as const, label: OBJECT_STATUS_LABELS.RESERVED };
    case 'DEPOSITED':
      return { variant: 'warning' as const, label: 'In giacenza' };
    case 'DONATED':
      return { variant: 'default' as const, label: 'Ritirato' };
    case 'CANCELLED':
      return { variant: 'danger' as const, label: OBJECT_STATUS_LABELS.CANCELLED };
    case 'BLOCKED':
      return { variant: 'danger' as const, label: OBJECT_STATUS_LABELS.BLOCKED };
    default:
      return { variant: 'default' as const, label: status };
  }
}

export default function EntityAvailabilityPage() {
  const [objects, setObjects] = useState<EntityObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const photoId = useId();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('OTHER');
  const [condition, setCondition] = useState<Condition>('GOOD');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [depositLocation, setDepositLocation] = useState('');
  const [depositNotes, setDepositNotes] = useState('');

  // Scanner etichetta scaffale
  const [showScanner, setShowScanner] = useState(false);
  const [cameraId, setCameraId] = useState<string | undefined>(undefined);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    fetchObjects();
  }, []);

  const fetchObjects = async () => {
    try {
      const res = await fetch('/api/operator/entity-objects');
      if (res.ok) {
        const data = await res.json();
        setObjects(data.objects || []);
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

  // --- Scanner etichetta scaffale -------------------------------------------------

  const isBackCamera = (label: string) => {
    const l = label.toLowerCase();
    return l.includes('back') || l.includes('rear') || l.includes('environment');
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;
        const videoDevices = devices
          .filter((d) => d.kind === 'videoinput')
          .map((d) => ({
            id: d.deviceId,
            label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
          }));
        if (videoDevices.length === 0) return;
        const back = videoDevices.find((d) => isBackCamera(d.label));
        setCameraId(back ? back.id : videoDevices[0].id);
      } catch (err) {
        console.error('Error getting cameras:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current = null;
    }
    setShowScanner(false);
  }, []);

  useEffect(() => {
    if (showScanner && videoRef.current && cameraId) {
      const scanner = new QrScanner(
        videoRef.current,
        (scanResult) => {
          const data = typeof scanResult === 'string' ? scanResult : scanResult.data;
          scanner.stop();
          setShowScanner(false);
          setDepositLocation(formatShelfLocation(data));
          toast.success('Posizione di deposito letta dall\'etichetta');
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          maxScansPerSecond: 5,
        }
      );
      scannerRef.current = scanner;
      scanner
        .setCamera(cameraId)
        .then(() => scanner.start())
        .catch((err) => {
          console.error('Scanner error:', err);
          toast.error("Errore nell'avvio della fotocamera");
        });
    } else if (!showScanner && scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current = null;
    }
  }, [showScanner, cameraId]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current = null;
      }
    };
  }, []);

  // --- Creazione -------------------------------------------------------------------

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Inserisci un titolo');
      return;
    }
    if (imageUrls.length === 0) {
      toast.error('Almeno una foto è obbligatoria');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/operator/entity-objects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          condition,
          imageUrls,
          depositLocation,
          depositNotes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchObjects();
        toast.success('Disponibilità pubblicata');
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
    setCondition('GOOD');
    setImageUrls([]);
    setDepositLocation('');
    setDepositNotes('');
  };

  const handleCloseModal = async () => {
    await stopScanner();
    setShowModal(false);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Magazzino</h1>
          <p className="text-gray-500">
            Oggetti giacenti nei tuoi depositi: l&apos;ente ne è il donatore
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          + Nuova disponibilità
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : objects.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nessuna disponibilità"
          description="Pubblica il primo oggetto del tuo magazzino"
        />
      ) : (
        <div className="grid gap-4">
          {objects.map((obj) => {
            const statusBadge = objectStatusBadge(obj.status);
            return (
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
                    <Badge variant={statusBadge.variant} pill>
                      {statusBadge.label}
                    </Badge>
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
                    {obj._count?.requests ? (
                      <>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="text-gray-500">
                          {obj._count.requests}{' '}
                          {obj._count.requests === 1 ? 'richiesta attiva' : 'richieste attive'}
                        </span>
                      </>
                    ) : null}
                  </>
                }
                ariaLabel={`Apri disponibilità ${obj.title}`}
              />
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Nuova disponibilità"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={handleCloseModal}
              className="flex-1"
              disabled={creating}
            >
              Annulla
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={creating || !title.trim() || imageUrls.length === 0}
              className="flex-1"
            >
              {creating ? 'Pubblicazione...' : 'Pubblica'}
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
            placeholder="Es. Sedia in legno"
          />

          <Textarea
            label="Descrizione"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Dettagli dell'oggetto, misure, colore..."
          />

          <Select
            label="Categoria *"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            options={categoryOptions}
          />

          <Select
            label="Condizione *"
            value={condition}
            onChange={(e) => setCondition(e.target.value as Condition)}
            options={conditionOptions}
          />

          <div>
            <span id={photoId} className="block text-sm font-medium text-gray-700 mb-1">
              Foto *
            </span>
            <div aria-labelledby={photoId}>
              <ImageUploader
                onImagesChange={setImageUrls}
                maxFiles={5}
                currentImages={imageUrls}
              />
            </div>
          </div>

          <div>
            <Input
              type="text"
              label="Posizione di deposito"
              value={depositLocation}
              onChange={(e) => setDepositLocation(e.target.value)}
              placeholder="Es. (S): MAGAZZINO - (S): A-12 - (P): 1"
            />
            <div className="mt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowScanner(true)}
                className="w-full sm:w-auto"
              >
                <QrCode className="w-4 h-4 mr-2" aria-hidden="true" />
                Scansiona etichetta scaffale
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Il bene è già in giacenza: la posizione va indicata alla pubblicazione,
              non al momento della consegna.
            </p>
          </div>

          {showScanner && (
            <div className="rounded-lg overflow-hidden border border-gray-200">
              <video ref={videoRef} className="w-full h-64 object-cover bg-black" />
              <div className="p-2 text-center">
                <Button type="button" variant="secondary" onClick={stopScanner}>
                  <Camera className="w-4 h-4 mr-2" aria-hidden="true" />
                  Annulla scansione
                </Button>
              </div>
            </div>
          )}

          <Textarea
            label="Note di deposito"
            value={depositNotes}
            onChange={(e) => setDepositNotes(e.target.value)}
            rows={2}
            placeholder="Es. aprire il magazzino su richiesta"
          />
        </div>
      </Modal>
    </div>
  );
}
