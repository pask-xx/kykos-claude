'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  QrCode, Share2, Mail, MessageCircle, Download, Printer,
  Clock, ChevronLeft, AlertCircle,
} from 'lucide-react';
import {
  Card, CardContent, Button, Modal, ModalFooter, Alert,
  SkeletonCard, EmptyState, toast,
} from '@/components/ui';
import { useQrActions } from './useQrActions';
import { cn } from '@/lib/utils';

/**
 * Payload normalizzato che il `transform` di QrPage deve produrre.
 * Permette di wrappare 4+ shape API diverse (donor/recipient/operator) con
 * un singolo componente.
 */
export interface QrPayload {
  qrData: string;
  qrImageUrl: string;
  description?: string;
  label?: string;
  entityName?: string;
  entityHoursInfo?: string | null;
}

export interface QrPageProps {
  /** Titolo principale (es. "QR Code per la donazione"). Visibile in <h1>. */
  title: string;
  /** Sottotitolo (es. titolo oggetto / richiesta). Visibile sotto h1. */
  subtitle?: string;
  /** URL API da cui caricare il payload QR. */
  apiUrl: string;
  /** Path da cui tornare indietro (bottone "← Indietro"). Default: router.back(). */
  backHref?: string;
  /** Back button label custom. Default: "← Indietro". */
  backLabel?: string;
  /** Mostra bottone "Orari Ente" sotto al QR (se `data.entityHoursInfo` presente). Default: true. */
  showEntityHours?: boolean;
  /** Tipo per naming download/print (es. "deliver", "pickup"). Default: "qr". */
  qrType?: string;
  /**
   * Adattatore: estrae dal payload API i campi necessari al rendering.
   * Riceve `unknown` perché ogni API ha shape diversa; l'adattatore fa
   * narrowing esplicito. Se omesso, il componente assume che la risposta
   * sia già nella shape `QrPayload`.
   */
  transform?: (raw: unknown) => QrPayload;
}

/**
 * <QrPage> — componente riusabile per pagine QR standalone
 * (donor/recipient/operator). Sostituisce il markup duplicato in:
 *
 *  - `src/app/donor/qr/[requestId]/page.tsx`
 *  - `src/app/donor/delivery-qr/[requestId]/page.tsx`
 *  - `src/app/donor/qr-goods/[requestId]/page.tsx`
 *  - `src/app/recipient/qr/[requestId]/page.tsx`
 *  - `src/app/recipient/qr-goods/[requestId]/page.tsx`
 *  - `src/app/operator/goods-pickup-qr/[requestId]/page.tsx`
 *  - `src/app/operator/operator-qr-pickup/[requestId]/page.tsx` (NEW)
 *
 * Funzionalità:
 *  - Fetch con gestione loading/errore (SkeletonCard × 3 / Alert)
 *  - Rendering QR 256x256 con overlay logo KYKOS
 *  - 5 azioni standard: Condividi (Web Share), Email, WhatsApp, Download, Stampa A4
 *  - Bottone "Orari Ente" condizionato (modale con HTML Tiptap)
 *  - Trasform payload API opzionale per gestire shape diverse
 *
 * Tutte le primitive UI vengono da `@/components/ui` (Card, Button, Modal,
 * Alert, EmptyState, SkeletonCard, toast).
 *
 * Esempio d'uso:
 *   <QrPage
 *     title="QR Code per la donazione"
 *     subtitle={objectTitle}
 *     apiUrl={`/api/donation/${requestId}/qr`}
 *     backHref="/donor/dashboard"
 *     qrType="deliver"
 *     transform={(raw) => {
 *       const r = raw as DonationQrResponse;
 *       return {
 *         qrData: r.qrCodes.deliver.data,
 *         qrImageUrl: r.qrCodes.deliver.imageUrl,
 *         description: r.qrCodes.deliver.description,
 *         label: r.qrCodes.deliver.label,
 *         entityName: r.entityName,
 *         entityHoursInfo: r.entityHoursInfo,
 *       };
 *     }}
 *   />
 */
export function QrPage({
  title,
  subtitle,
  apiUrl,
  backHref,
  backLabel = 'Indietro',
  showEntityHours = true,
  qrType = 'qr',
  transform,
}: QrPageProps) {
  const router = useRouter();
  const [payload, setPayload] = useState<QrPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHoursModal, setShowHoursModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(apiUrl);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Errore nel caricamento');
        }
        const raw = await res.json();
        if (cancelled) return;
        const normalized = transform ? transform(raw) : (raw as QrPayload);
        setPayload(normalized);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Errore di rete');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [apiUrl, transform]);

  const requestId = extractRequestId(apiUrl);

  const actions = useQrActions({
    qrData: payload?.qrData ?? '',
    qrImageUrl: payload?.qrImageUrl,
    title,
    subtitle,
    requestId,
    type: qrType,
  });

  // Loading: 3 SkeletonCard (coerente con Fase 6.1)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8 max-w-md">
          <SkeletonCard />
          <div className="mt-4 space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </main>
      </div>
    );
  }

  // Errore di fetch
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8 max-w-md">
          <BackButton backHref={backHref} backLabel={backLabel} onClick={() => router.back()} />
          <Alert type="error" title="Errore" icon={<AlertCircle />}>
            {error}
          </Alert>
        </main>
      </div>
    );
  }

  // QR mancante
  if (!payload || !payload.qrImageUrl) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8 max-w-md">
          <BackButton backHref={backHref} backLabel={backLabel} onClick={() => router.back()} />
          <EmptyState
            icon={QrCode}
            title="QR non disponibile"
            description="Il QR code per questa richiesta non è stato ancora generato."
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8 max-w-md">
        <BackButton backHref={backHref} backLabel={backLabel} onClick={() => router.back()} />

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>

        <Card>
          <CardContent className="space-y-4">
            {payload.description && (
              <p className="text-sm text-gray-600 text-center">{payload.description}</p>
            )}

            {/* QR con overlay logo KYKOS */}
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={payload.qrImageUrl}
                  alt={payload.label ? `QR Code per ${payload.label}` : 'QR Code'}
                  className="w-64 h-64"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white rounded-full p-2 shadow-md">
                    <img src="/albero.svg" alt="KYKOS" className="w-10 h-10" />
                  </div>
                </div>
              </div>
            </div>

            {/* qrData testuale (debug + verifica manuale) */}
            <p className="text-xs text-gray-400 text-center font-mono truncate px-4">
              {payload.qrData}
            </p>

            {/* 5 azioni standard */}
            <div className="space-y-2 pt-2">
              <Button
                type="button"
                variant="primary"
                size="lg"
                leftIcon={<Share2 className="h-4 w-4" />}
                loading={actions.sharing}
                onClick={actions.handleWebShare}
                className="w-full"
              >
                {actions.sharing ? 'Condivisione...' : 'Condividi QR'}
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  leftIcon={<Mail className="h-4 w-4" />}
                  onClick={actions.handleEmailShare}
                  className="flex-1"
                >
                  Email
                </Button>
                <Button
                  type="button"
                  variant="success"
                  leftIcon={<MessageCircle className="h-4 w-4" />}
                  onClick={actions.handleWhatsAppShare}
                  className="flex-1"
                >
                  WhatsApp
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={actions.handleDownload}
                  className="flex-1"
                >
                  Download
                </Button>
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                leftIcon={<Printer className="h-4 w-4" />}
                onClick={actions.handlePrint}
                className="w-full"
              >
                Stampa QR
              </Button>

              {showEntityHours && payload.entityHoursInfo && (
                <Button
                  type="button"
                  variant="ghost"
                  leftIcon={<Clock className="h-4 w-4" />}
                  onClick={() => setShowHoursModal(true)}
                  className="w-full"
                >
                  Orari Ente
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modale orari ente */}
      <Modal
        isOpen={showHoursModal}
        onClose={() => setShowHoursModal(false)}
        title={payload.entityName ? `Orari ${payload.entityName}` : 'Orari Ente'}
        size="md"
      >
        <div className="p-6">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: payload.entityHoursInfo ?? '' }}
          />
        </div>
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowHoursModal(false)}
            className="ml-auto"
          >
            Chiudi
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

function BackButton({
  backHref,
  backLabel,
  onClick,
}: {
  backHref?: string;
  backLabel: string;
  onClick: () => void;
}) {
  const content = (
    <span className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
      <ChevronLeft className="h-4 w-4" />
      {backLabel}
    </span>
  );
  if (backHref) {
    return (
      <Link href={backHref} className="inline-block">
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className="inline-block">
      {content}
    </button>
  );
}

/**
 * Estrae l'ID request dall'URL API (ultimo segmento path).
 * Usato dal `useQrActions` hook per il filename download / print.
 * Fallback: stringa vuota (verrà sostituita da `Date.now()` nel filename).
 */
function extractRequestId(apiUrl: string): string {
  const parts = apiUrl.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? '';
}
