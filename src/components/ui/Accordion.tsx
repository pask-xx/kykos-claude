'use client';

import { ReactNode, useState, useId } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionDivider, type SectionDividerProps } from './SectionDivider';

/**
 * <Accordion> — sezione collassabile con header label+linea e body
 * toggle on/off. Pattern usato in sostituzione di <Tabs> per liste
 * con 2 categorie binarie complementari (es. "In attesa" / "Autorizzati").
 *
 * Rispetto al semplice <details>/<summary> HTML:
 * - Stato controllato dal consumer (defaultOpen + open/onOpenChange opzionali).
 * - Header riusa <SectionDivider> per label+linea+count coerenti.
 * - Chevron ruota 90° (→ diventa ↓) quando espanso.
 * - a11y: button.toggle con aria-expanded + aria-controls sul body.
 *
 * Stato default:
 * - Se non passato `defaultOpen`, parte chiuso.
 * - NON persiste (refresh = reset). Per persistenza, il consumer può
 *   gestire open/onOpenChange e salvare in localStorage o backend.
 *
 * Esempio:
 *   <Accordion
 *     label="In attesa"
 *     count={pending.length}
 *     color="warning"
 *     defaultOpen
 *   >
 *     {pending.map(item => <Card key={item.id} {...item} />)}
 *   </Accordion>
 */
export interface AccordionProps {
  label: string;
  count: number;
  color: SectionDividerProps['color'];
  /** Contenuto mostrato sotto l'header quando expanded. */
  children: ReactNode;
  /** Default: false. Se true, parte espanso. */
  defaultOpen?: boolean;
  /** Stato controllato (opzionale). Se passato, ignora defaultOpen. */
  open?: boolean;
  /** Callback quando cambia lo stato. Necessario se `open` è passato. */
  onOpenChange?: (open: boolean) => void;
  /** Slot per azioni extra nell'header (es. bottone "Vedi tutti"). */
  headerActions?: ReactNode;
  className?: string;
  /** Etichetta screen-reader per il button toggle (default: "Espandi/comprimi {label}"). */
  toggleLabel?: string;
}

export function Accordion({
  label,
  count,
  color,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  headerActions,
  className,
  toggleLabel,
}: AccordionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const toggle = () => {
    const next = !isOpen;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const panelId = useId();
  const buttonId = useId();
  const defaultToggleLabel = `${isOpen ? 'Comprimi' : 'Espandi'} sezione "${label}"`;

  return (
    <section className={cn('space-y-3', className)}>
      <div className="flex items-center gap-3">
        <button
          id={buttonId}
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-label={toggleLabel || defaultToggleLabel}
          className={cn(
            'flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded',
            'min-h-[44px] min-w-[44px] -m-2 p-2', // target size a11y (44x44px)
          )}
        >
          <ChevronRight
            className={cn(
              'h-5 w-5 text-gray-500 transition-transform flex-shrink-0',
              isOpen && 'rotate-90',
              'group-hover:text-primary-600',
            )}
            aria-hidden="true"
          />
          <SectionDivider label={label} count={count} color={color} className="flex-1" />
        </button>
        {headerActions}
      </div>
      {isOpen && (
        <div id={panelId} role="region" aria-labelledby={buttonId} className="space-y-3">
          {children}
        </div>
      )}
    </section>
  );
}
