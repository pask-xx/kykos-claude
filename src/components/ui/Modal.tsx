'use client';

import { ReactNode, useEffect, useRef, useCallback } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Titolo mostrato nell'header di default. Se passi anche `header`, questo
   * viene ignorato (lo slot custom sostituisce l'intero header).
   * `ReactNode` per supportare testo semplice, JSX o componenti custom.
   */
  title?: ReactNode;
  /**
   * Slot custom per sostituire l'intero header di default (gradient, loghi,
   * layout non-standard). Se passato, ignora `title` e `showClose`.
   */
  header?: ReactNode;
  /**
   * Slot per il footer. Non occupa spazio se non passato.
   * Per il footer standard, preferisci `<ModalFooter>` (più semantico e
   * gestisce padding/border-top).
   */
  footer?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
  /** Classi aggiuntive per l'overlay (default: 'bg-black/50'). */
  overlayClassName?: string;
  /** Classi aggiuntive per il box del modal (default: 'rounded-xl shadow-xl'). */
  contentClassName?: string;
  /** z-index del modal (default: 50). Usa > 50 per modali "stacked" su altri modali. */
  zIndex?: number | string;
  /** Chiudi il modal premendo ESC (default: true). */
  closeOnEsc?: boolean;
  /** Blocca lo scroll del body quando il modal è aperto (default: true). */
  preventScroll?: boolean;
  /** aria-label del dialog. Se non passato, usa `title` (se è una stringa). */
  ariaLabel?: string;
  /**
   * Classi aggiuntive per il bottone ✕ di default. Usato da `NotificationBell`
   * (rounded-full) e `PdfViewerModal` (w-10 h-10).
   */
  closeButtonClassName?: string;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
};

/** Counter di modali aperti per supportare lo stack di modali nested. */
let openModalCount = 0;
/** Salva lo `overflow` originale del body al primo lock per ripristinarlo. */
let originalBodyOverflow: string | null = null;

function lockBodyScroll() {
  if (typeof document === 'undefined') return;
  if (openModalCount === 0) {
    originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  openModalCount += 1;
}

function unlockBodyScroll() {
  if (typeof document === 'undefined') return;
  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount === 0) {
    document.body.style.overflow = originalBodyOverflow ?? '';
    originalBodyOverflow = null;
  }
}

/**
 * Hook interno: trova il primo elemento focussabile dentro `ref` per
 * l'auto-focus. Se non trova nulla, ritorna null (il chiamante userà il
 * bottone ✕ come fallback).
 */
function getFirstFocusable(ref: React.RefObject<HTMLElement>): HTMLElement | null {
  if (!ref.current) return null;
  const SELECTOR =
    'a[href], area[href], input:not([disabled]), select:not([disabled]),' +
    ' textarea:not([disabled]), button:not([disabled]), iframe, object,' +
    ' embed, [tabindex]:not([tabindex="-1"]), [contenteditable]';
  const el = ref.current.querySelector<HTMLElement>(`[data-autofocus], ${SELECTOR}`);
  return el;
}

export function Modal({
  isOpen,
  onClose,
  title,
  header,
  footer,
  children,
  size = 'md',
  showClose = true,
  overlayClassName = 'bg-black/50',
  contentClassName = 'rounded-xl shadow-xl',
  zIndex = 50,
  closeOnEsc = true,
  preventScroll = true,
  ariaLabel,
  closeButtonClassName = '',
}: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // ESC handler: chiama onClose se abilitato. Cleanup su unmount/isOpen change.
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc && isOpen) {
        e.stopPropagation();
        onClose();
      }
    },
    [closeOnEsc, isOpen, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (closeOnEsc) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, closeOnEsc, handleKeyDown]);

  // Body scroll lock con counter (supporta stack di modali nested).
  useEffect(() => {
    if (!isOpen || !preventScroll) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [isOpen, preventScroll]);

  // Focus management: salva trigger, auto-focus al primo focussabile (o ✕),
  // ripristina focus al trigger alla chiusura.
  useEffect(() => {
    if (!isOpen) return;
    // Salva l'elemento attivo al mount (tipicamente il trigger).
    previousActiveElement.current =
      typeof document !== 'undefined' ? (document.activeElement as HTMLElement) : null;

    // Aspetta un frame per assicurarsi che il content sia in DOM.
    const t = window.setTimeout(() => {
      const target = getFirstFocusable(contentRef) ?? contentRef.current?.querySelector<HTMLElement>('button');
      target?.focus();
    }, 0);

    return () => {
      window.clearTimeout(t);
      // Ripristina focus al trigger solo se ancora in DOM.
      const el = previousActiveElement.current;
      if (el && typeof el.focus === 'function' && document.contains(el)) {
        el.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // `aria-label` del dialog: priorita' ad `ariaLabel`, poi `title` (se
  // stringa), altrimenti undefined.
  const dialogLabel =
    ariaLabel ?? (typeof title === 'string' ? title : undefined);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex }}
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 ${overlayClassName}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label={dialogLabel}
        className={`
          relative bg-white ${contentClassName}
          w-full ${sizeClasses[size]}
          max-h-[90vh] overflow-hidden flex flex-col
        `}
      >
        {/* Header: custom slot OPPURE default (title + ✕) */}
        {header ?? (
          (title || showClose) && (
            <div className="flex items-center justify-between p-6 border-b">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              )}
              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Chiudi"
                  data-autofocus
                  className={`w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ml-auto ${closeButtonClassName}`}
                >
                  ✕
                </button>
              )}
            </div>
          )
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Footer slot */}
        {footer && (
          <div className="border-t">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={`p-6 border-t bg-gray-50 ${className}`}>
      {children}
    </div>
  );
}
