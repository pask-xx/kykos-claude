'use client';

import { MouseEvent, ReactElement, ReactNode, cloneElement, isValidElement, useState } from 'react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel?: () => void;
  children: ReactNode;
}

/**
 * Dialog di conferma KYKOS con trigger a children (zero rotture API).
 *
 * Pattern retro-compat: `children` e' il trigger. Viene usato
 * `cloneElement` per aggiungere `onClick` che apre il modal, preservando
 * onClick esistente, props (loading, disabled, className, ...) e aspetto
 * del children originale.
 *
 * Anti-pattern eliminato: prima usava `<div onClick>` come trigger
 * (vietato in `docs/DESIGN.md`). Ora il trigger e' il children originale
 * (sempre un `<button>` o `<Button>` nei consumer reali) con onClick
 * aggiunto, che resta accessibile (focus, keyboard, screen reader).
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Annulla',
  variant = 'danger',
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
    onCancel?.();
  };

  // Se children e' un React element (NON un ReactPortal), aggiungo onClick
  // che apre il modal preservando l'onClick esistente e tutte le altre
  // props (loading, disabled, className custom, ...). Altrimenti
  // (string/null/array/Portal), fallback a button nativo.
  const trigger = isValidElement(children) && typeof (children as ReactElement).type !== 'symbol'
    ? cloneElementWithClick(children as ReactElement<{ onClick?: (e: MouseEvent) => void }>, () => setOpen(true))
    : (
        <button type="button" onClick={() => setOpen(true)}>
          {children}
        </button>
      );

  return (
    <>
      {trigger}
      <Modal
        isOpen={open}
        onClose={handleCancel}
        title={title}
        size="sm"
      >
        <div className="p-6">
          <p className="text-gray-600">{message}</p>
        </div>
        <ModalFooter>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={handleCancel}>
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={variant === 'warning' ? 'warning' : 'danger'}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </>
  );
}

/**
 * Helper: clona un React element aggiungendo un onClick che apre il modal,
 * preservando l'onClick esistente (se presente) e tutte le altre props.
 *
 * Type-erasure intenzionale: il tipo del children non ci interessa, sappiamo
 * solo che e' un React element (di solito <button> o <Button>).
 */
function cloneElementWithClick(
  element: ReactElement<{ onClick?: (e: MouseEvent) => void }>,
  openModal: () => void
): ReactElement {
  // `isValidElement` esclude ReactFragment/ReactPortal: siamo dentro al
  // ramo `isValidElement(children)`, quindi `element` e' un ReactElement
  // (NON un ReactPortal). Il narrowing e' safe.
  const existingOnClick = element.props.onClick;
  return cloneElement(element, {
    onClick: (e: MouseEvent) => {
      existingOnClick?.(e);
      if (!e.defaultPrevented) {
        openModal();
      }
    },
  });
}
