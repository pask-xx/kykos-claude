'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * Switch primitive — toggle on/off con semantica `role="switch"` WCAG.
 *
 * Differenza concettuale da `<Checkbox>`: lo switch rappresenta
 * un effetto immediato (es. "Abilita stampa etichetta" — al click
 * parte la PATCH), mentre la checkbox rappresenta una scelta che
 * diventa effettiva al submit del form. KYKOS usa lo switch
 * per toggle a effetto immediato (operator/*).
 *
 * Differenza dal pattern custom introdotto in Fase 22.2:
 * - Quel pattern wrappava 3 concetti in un button (button + role +
 *   aria-label + span knob). La primitive li incapsula in un
 *   componente con API minimale, eliminando la ripetizione in 3 file
 *   (operator/organization × 4, operator/donors/[id] × 1,
 *   operator/recipients/[id] × 2).
 * - Aggiunge supporto per label visibile + `aria-describedby` (per
 *   helper text contestuale, es. "Approvazione automatica delle
 *   richieste di beni"). Il pattern custom supportava solo
 *   `aria-label` e il testo doveva stare in un `<p>` separato.
 *
 * Esempio base (label obbligatoria per accessibilità):
 *   <Switch
 *     checked={printLabel}
 *     onChange={setPrintLabel}
 *     label="Abilita stampa etichetta"
 *   />
 *
 * Esempio con helper text (consigliato per toggle con descrizione):
 *   <Switch
 *     checked={autoApprove}
 *     onChange={setAutoApprove}
 *     label="Approvazione automatica"
 *     description="Le richieste verranno approvate senza intervento operatore"
 *   />
 *
 * Esempio con loading (chiamata API in corso, disabilitato):
 *   <Switch
 *     checked={enabled}
 *     onChange={handleToggle}
 *     label="Funzione X"
 *     loading={isSaving}
 *   />
 */

export interface SwitchProps {
  /** Stato on/off del toggle */
  checked: boolean;
  /** Callback invocata al click. Riceve il nuovo stato (negazione del corrente). */
  onChange: (checked: boolean) => void;
  /** Label visibile e annunciata screen reader. Obbligatoria. */
  label: string;
  /** Testo descrittivo sotto la label. Opzionale, ma consigliato per toggle con effetto complesso. */
  description?: string;
  /** Disabilita interazione e abbassa opacità. */
  disabled?: boolean;
  /** Mostra spinner e disabilita interazione. Per chiamate API in corso. */
  loading?: boolean;
  /** Classi Tailwind addizionali per il container esterno. */
  className?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onChange, label, description, disabled = false, loading = false, className }, ref) => {
    const id = useId();
    const descriptionId = description ? `${id}-description` : undefined;

    const isInactive = disabled || loading;

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          aria-describedby={descriptionId}
          disabled={isInactive}
          onClick={() => onChange(!checked)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full',
            'border-2 border-transparent transition-colors duration-200 ease-in-out',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            checked ? 'bg-success-500' : 'bg-gray-300',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0',
              'transition duration-200 ease-in-out',
              checked ? 'translate-x-5' : 'translate-x-0',
            )}
          />
        </button>
        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <label
                htmlFor={id}
                className={cn(
                  'block text-sm font-medium text-gray-900 cursor-pointer',
                  isInactive && 'opacity-50',
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p
                id={descriptionId}
                className={cn('text-sm text-gray-500 mt-0.5', isInactive && 'opacity-50')}
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
);

Switch.displayName = 'Switch';
