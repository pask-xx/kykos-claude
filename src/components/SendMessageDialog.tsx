'use client';

/**
 * SendMessageDialog — dialog per inviare una notifica a un utente (donor,
 * recipient, operator). Usato da operator/donors/[id] e operator/recipients/[id].
 *
 * Il banner di success (Alert variant="success") resta inline, NON viene
 * sostituito con `toast.success`: e' feedback di FORM dentro il dialog,
 * l'utente deve vederlo PRIMA della chiusura. Sostituendolo con un toast
 * l'utente vedrebbe il dialog sparire e poi il toast comparire — UX
 * peggiore. Pattern legittimo, NON e' l'anti-pattern P3.
 */

import { ReactElement, ReactNode, cloneElement, isValidElement, useState } from 'react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

interface SendMessageDialogProps {
  userId: string;
  userType: 'USER' | 'OPERATOR';
  userName: string;
  onSent?: () => void;
  children: ReactNode;
}

export default function SendMessageDialog({ userId, userType, userName, onSent, children }: SendMessageDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setTitle('');
    setMessage('');
    setError(null);
    setSuccess(false);
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/operator/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: userId, recipientType: userType, title, message }),
      });

      if (res.ok) {
        setSuccess(true);
        setTitle('');
        setMessage('');
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          onSent?.();
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || "Errore nell'invio");
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setSending(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    reset();
  };

  // Pattern cloneElement identico a ConfirmDialog: aggiunge onClick che apre
  // il modal preservando props esistenti del children (icone, classi, ...).
  // Anti-pattern <div onClick> eliminato.
  const trigger = isValidElement(children) && typeof (children as ReactElement).type !== 'symbol'
    ? cloneElement(children as ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, {
        onClick: (e: React.MouseEvent) => {
          const existing = (children as ReactElement<{ onClick?: (e: React.MouseEvent) => void }>).props.onClick;
          existing?.(e);
          if (!e.defaultPrevented) setOpen(true);
        },
      })
    : (
        <button type="button" onClick={() => setOpen(true)}>
          {children}
        </button>
      );

  const canSend = !sending && title.trim() && message.trim();

  return (
    <>
      {trigger}
      <Modal
        isOpen={open}
        onClose={handleCancel}
        title="Invia messaggio"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">Invia una notifica a {userName}</p>

          {error && <Alert type="error">{error}</Alert>}
          {success && <Alert type="success">Messaggio inviato!</Alert>}

          {!success && (
            <>
              <Input
                label="Oggetto"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Es. Richiesta documenti"
              />
              <Textarea
                label="Messaggio"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Scrivi il messaggio..."
                rows={4}
              />
            </>
          )}
        </div>
        <ModalFooter>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={handleCancel} disabled={sending}>
              Annulla
            </Button>
            {!success && (
              <Button type="button" variant="primary" onClick={handleSend} disabled={!canSend} loading={sending}>
                {sending ? 'Invio...' : 'Invia'}
              </Button>
            )}
          </div>
        </ModalFooter>
      </Modal>
    </>
  );
}
