'use client';

/**
 * Modal "dettaglio notifica" — estratto da NotificationBell per separare le
 * responsabilita' (dropdown vs modal). Side-effect: alla chiusura, segna la
 * notifica come letta (PATCH) e aggiorna badge.
 *
 * 3 punti di chiusura chiamano la stessa `handleClose` (con useCallback):
 *  - click sull'overlay
 *  - click sul ✕
 *  - click sul link "Vai al contenuto" (prima naviga, poi chiude)
 *
 * `closeButtonClassName="rounded-full"` per il ✕ custom (il primitive di
 * default usa `rounded-lg`).
 */

import { useCallback } from 'react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface NotificationDetail {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  DONATION_CONFIRMED: 'Conferma donazione',
  REQUEST_APPROVED: 'Richiesta approvata',
  REQUEST_REJECTED: 'Richiesta rifiutata',
  OBJECT_AVAILABLE: 'Oggetto disponibile',
  OBJECT_RESERVED: 'Oggetto riservato',
  OBJECT_DELIVERED: 'Oggetto consegnato',
  OBJECT_DEPOSITED: 'Oggetto depositato',
  OBJECT_CANCELLED: 'Oggetto cancellato',
  REPORT_RECEIVED: 'Segnalazione ricevuta',
  REPORT_RESOLVED: 'Segnalazione risolta',
  MESSAGE_FROM_OPERATOR: "Messaggio dall'ente",
  NEW_REQUEST: 'Nuova richiesta',
  NEW_REPORT: 'Nuova segnalazione',
  GOODS_REQUEST_CREATED: 'Richiesta beni creata',
  GOODS_REQUEST_APPROVED: 'Richiesta beni approvata',
  GOODS_REQUEST_REJECTED: 'Richiesta beni rifiutata',
  GOODS_REQUEST_FULFILLED: 'Richiesta beni soddisfatta',
  GOODS_OFFER_RECEIVED: 'Offerta ricevuta',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface NotificationDetailModalProps {
  notification: NotificationDetail;
  apiPath: string;
  onClose: () => void;
  /** Callback per aggiornare lo state parent (notifications + unreadCount). */
  onMarkedRead: (id: string) => void;
}

export default function NotificationDetailModal({
  notification,
  apiPath,
  onClose,
  onMarkedRead,
}: NotificationDetailModalProps) {
  // Centralizza la chiusura: se la notifica non e' ancora letta, marca come
  // letta PRIMA di chiudere. Usata da 3 punti (overlay, ✕, link).
  const handleClose = useCallback(() => {
    if (!notification.read) {
      fetch(`${apiPath}/${notification.id}`, { method: 'PATCH' }).catch(
        (err) => console.error('Error marking notification as read:', err)
      );
      onMarkedRead(notification.id);
    }
    onClose();
  }, [notification, apiPath, onMarkedRead, onClose]);

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title={
        <span>
          <span className="block text-xs text-gray-500 uppercase tracking-wide font-normal mb-1">
            {TYPE_LABELS[notification.type] || notification.type}
          </span>
          <span className="block text-lg font-bold text-gray-900">{notification.title}</span>
        </span>
      }
      size="sm"
      closeButtonClassName="rounded-full"
    >
      <div className="p-6">
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{notification.message}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">{formatDate(notification.createdAt)}</p>
        </div>
      </div>
      {notification.link && (
        <ModalFooter>
          <div className="flex justify-end">
            <a
              href={notification.link}
              onClick={handleClose}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Vai al contenuto →
            </a>
          </div>
        </ModalFooter>
      )}
    </Modal>
  );
}
