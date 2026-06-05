'use client';

import {
  QrCode, Share2, Mail, MessageCircle, Download, Printer, Clock,
} from 'lucide-react';
import { Modal, ModalFooter, Button } from '@/components/ui';
import { useQrActions } from './useQrActions';

/** Shape minima di un item street-to-deliver (object o goods request). */
export interface QrDialogItem {
  id: string;
  type: 'OBJECT' | 'GOODS';
  title: string;
  statusLabel: string;
  beneficiaryName: string;
  beneficiaryAddress?: string | null;
  entity: {
    name: string;
    address?: string | null;
    houseNumber?: string | null;
    cap?: string | null;
    city?: string | null;
    hoursInfo?: string | null;
  };
  depositLocation?: string | null;
  qrData: string;
  qrImageUrl?: string;
}

export interface QrDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Item da mostrare (street-to-deliver shape). */
  item: QrDialogItem | null;
}

/**
 * <QrDialog> — modale riusabile per mostrare un QR code inline in una lista
 * (usata da `src/app/operator/street-to-deliver/page.tsx`).
 *
 * Mostra:
 *  - Header con titolo (statusLabel) e X per chiudere (via `<Modal>`)
 *  - Info compatte: titolo oggetto, beneficiario, ente + indirizzo, orari
 *  - QR 224x224 con overlay logo KYKOS
 *  - 5 azioni standard riusate dal hook `useQrActions`
 *
 * Rimpiazza la modale inline custom (originariamente 100+ righe in
 * `street-to-deliver/page.tsx:332-438`).
 *
 * Esempio d'uso:
 *   <QrDialog
 *     isOpen={showQRDialog}
 *     onClose={() => setShowQRDialog(false)}
 *     item={selectedItem}
 *   />
 */
export function QrDialog({ isOpen, onClose, item }: QrDialogProps) {
  // Hook chiamato sempre (regola React) ma disattivato se `item` null
  const actions = useQrActions({
    qrData: item?.qrData ?? '',
    qrImageUrl: item?.qrImageUrl,
    title: item?.statusLabel ?? 'QR Code',
    subtitle: item?.title,
    requestId: item?.id ?? '',
    type: item?.type?.toLowerCase() ?? 'qr',
  });

  if (!item) return null;

  const entityAddress = buildEntityAddress(item.entity);
  const hasEntityHours = Boolean(item.entity.hoursInfo);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item.statusLabel} size="md">
      <div className="p-6 space-y-4">
        {/* Info compatte: titolo + beneficiario + ente */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
          <p className="font-medium text-gray-900">{item.title}</p>
          <p className="text-sm text-gray-500">
            Per: <span className="font-medium">{item.beneficiaryName}</span>
            {item.beneficiaryAddress && ` - ${item.beneficiaryAddress}`}
          </p>
          <p className="text-sm text-gray-500">
            Presso: <span className="font-medium">{item.entity.name}</span>
            {entityAddress && `, ${entityAddress}`}
          </p>
          {item.depositLocation && (
            <p className="text-sm text-gray-500">
              Posizione: <span className="font-medium">{item.depositLocation}</span>
            </p>
          )}
          {hasEntityHours && (
            <div className="flex items-start gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <div
                className="prose prose-xs max-w-none"
                dangerouslySetInnerHTML={{ __html: item.entity.hoursInfo ?? '' }}
              />
            </div>
          )}
        </div>

        {/* QR con overlay logo KYKOS */}
        {item.qrImageUrl ? (
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={item.qrImageUrl}
                alt="QR Code"
                className="w-56 h-56"
              />
              <div className="absolute top-2 left-2 bg-white rounded-full p-1 shadow">
                <img src="/albero.svg" alt="KYKOS" className="w-6 h-6" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-56 h-56 bg-gray-100 rounded-lg flex items-center justify-center">
              <QrCode className="h-12 w-12 text-gray-400" />
            </div>
          </div>
        )}

        {/* qrData testuale */}
        <p className="text-xs text-gray-400 text-center font-mono truncate px-4">
          {item.qrData}
        </p>
      </div>

      {/* Footer: 5 azioni in layout compatto */}
      <ModalFooter>
        <div className="space-y-2">
          <Button
            type="button"
            variant="primary"
            size="lg"
            leftIcon={<Share2 className="h-4 w-4" />}
            loading={actions.sharing}
            onClick={actions.handleWebShare}
            disabled={!item.qrImageUrl}
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
              disabled={!item.qrImageUrl}
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
            disabled={!item.qrImageUrl}
            className="w-full"
          >
            Stampa QR
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}

function buildEntityAddress(entity: QrDialogItem['entity']): string {
  const parts: string[] = [];
  if (entity.address) parts.push(entity.address);
  if (entity.houseNumber) parts.push(entity.houseNumber);
  if (entity.cap) parts.push(`-${entity.cap}`);
  if (entity.city) parts.push(entity.city);
  return parts.join(' ').trim();
}
