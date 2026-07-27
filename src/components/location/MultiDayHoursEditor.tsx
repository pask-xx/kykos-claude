'use client';

/**
 * Editor multi-slot orari di apertura per sedi KYKOS (Location + Organization).
 *
 * Componente riusato in:
 *  - src/app/intermediary/profile/page.tsx (sede principale, su Organization.hours)
 *  - src/app/intermediary/locations/page.tsx (sedi aggiuntive, su Location.hours)
 *
 * Semantica per giorno:
 *  - `null`   = giorno **chiuso** esplicitamente
 *  - `[]`     = giorno **non specificato** (stato neutro, mostrato come "—")
 *  - `[s1,...]` = 1+ fasce orarie (no overlap, no slot a cavallo mezzanotte)
 *
 * Il componente è **controlled**: riceve `value` e `onChange`, NON gestisce
 * state interno. Validazione lato client (open<close, no overlap) bloccante
 * sul submit, ma non blocca l'editing (i messaggi d'errore appaiono solo al
 * salvataggio).
 *
 * Stile: solo primitive KYKOS (Card, Button) + classi Tailwind per layout.
 * Niente colori raw (regola Design System).
 */

import { useState, useId } from 'react';
import { Plus, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  LOCATION_DAY_KEYS,
  LOCATION_DAY_LABELS,
  LOCATION_DAY_LABELS_SHORT,
} from '@/types';
import type { LocationHours, LocationDayKey, LocationHoursSlot } from '@/types';

const HHMM_24H = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_SLOTS_PER_DAY = 4;

export interface MultiDayHoursEditorProps {
  /**
   * Valore corrente (shape v2: array di slot per giorno, o null).
   * null = nessun orario specificato (stato vuoto).
   */
  value: LocationHours | null;
  onChange: (next: LocationHours | null) => void;
  /** Mostra/nasconde l'header con titolo "Orari di apertura". Default true. */
  showHeader?: boolean;
  /** Errore globale mostrato in cima (es. "Le fasce orarie non possono sovrapporsi"). */
  errorMessage?: string | null;
}

/**
 * Validazione client di una fascia singola.
 * Ritorna stringa di errore o null se valida.
 */
function validateSlot(slot: LocationHoursSlot): string | null {
  if (!HHMM_24H.test(slot.open)) return 'Formato HH:MM richiesto';
  if (!HHMM_24H.test(slot.close)) return 'Formato HH:MM richiesto';
  if (slot.open >= slot.close) return 'Apertura < chiusura';
  return null;
}

/**
 * Validazione array di slot (no overlap, max 4).
 * Ritorna mappa index→messaggio d'errore o {} se tutti validi.
 */
function validateSlots(slots: LocationHoursSlot[]): Record<number, string> {
  const errors: Record<number, string> = {};
  if (slots.length > MAX_SLOTS_PER_DAY) {
    errors[0] = `Massimo ${MAX_SLOTS_PER_DAY} fasce orarie per giorno`;
  }
  slots.forEach((s, i) => {
    const e = validateSlot(s);
    if (e) errors[i] = e;
  });
  // No overlap
  if (slots.length >= 2) {
    const sorted = slots
      .map((s, i) => ({ s, i }))
      .sort((a, b) => a.s.open.localeCompare(b.s.open));
    for (let k = 1; k < sorted.length; k++) {
      if (sorted[k].s.open < sorted[k - 1].s.close) {
        errors[sorted[k].i] = 'Sovrapposizione con fascia precedente';
      }
    }
  }
  return errors;
}

export function MultiDayHoursEditor({
  value,
  onChange,
  showHeader = true,
  errorMessage,
}: MultiDayHoursEditorProps) {
  // Stato vuoto: value === null → pulsante "Configura orari"
  if (value === null) {
    return (
      <div>
        {showHeader && (
          <h3 className="text-sm font-semibold text-gray-900 mb-3 inline-flex items-center gap-2">
            <Clock className="h-4 w-4" aria-hidden="true" />
            Orari di apertura
          </h3>
        )}
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center bg-gray-50">
          <p className="text-sm text-gray-600 mb-3">
            Nessun orario specificato. Aggiungi le fasce orarie di apertura per ciascun giorno della settimana.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              // Inizializza con tutti i giorni "chiuso" esplicito
              const empty: LocationHours = {};
              for (const day of LOCATION_DAY_KEYS) empty[day] = null;
              onChange(empty);
            }}
            leftIcon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            Configura orari
          </Button>
        </div>
      </div>
    );
  }

  const updateDay = (day: LocationDayKey, slots: LocationHoursSlot[] | null) => {
    onChange({ ...value, [day]: slots });
  };

  return (
    <div>
      {showHeader && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 inline-flex items-center gap-2">
            <Clock className="h-4 w-4" aria-hidden="true" />
            Orari di apertura
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
          >
            Cancella tutti
          </Button>
        </div>
      )}
      {errorMessage && (
        <p className="text-sm text-error-600 mb-3" role="alert">
          {errorMessage}
        </p>
      )}
      <div className="space-y-2">
        {LOCATION_DAY_KEYS.map((day) => (
          <DayHoursEditor
            key={day}
            day={day}
            slots={value[day] ?? null}
            onChange={(slots) => updateDay(day, slots)}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-3">
        Lascia vuoto per indicare &quot;chiuso&quot; in un giorno. Formato 24h HH:MM.
        Puoi aggiungere fino a {MAX_SLOTS_PER_DAY} fasce orarie al giorno (es. mattina + pomeriggio).
      </p>
    </div>
  );
}

// =============================================================
// DayHoursEditor — sub-componente per un singolo giorno
// =============================================================

export interface DayHoursEditorProps {
  day: LocationDayKey;
  slots: LocationHoursSlot[] | null;
  onChange: (next: LocationHoursSlot[] | null) => void;
}

function DayHoursEditor({ day, slots, onChange }: DayHoursEditorProps) {
  const selectId = useId();
  const dayLabel = LOCATION_DAY_LABELS[day];
  const dayLabelShort = LOCATION_DAY_LABELS_SHORT[day];

  // Stato del select: 'closed' | 'open'
  // null = chiuso (valore esplicito)
  const state: 'closed' | 'open' = slots && slots.length > 0 ? 'open' : 'closed';
  const slotErrors = state === 'open' && slots ? validateSlots(slots) : {};

  const handleStateChange = (newState: 'closed' | 'open') => {
    if (newState === 'closed') {
      onChange(null); // chiuso
    } else if (!slots || slots.length === 0) {
      // Stato neutro → apri con prima fascia 09-12 (euristica mattina)
      onChange([{ open: '09:00', close: '12:00' }]);
    }
  };

  const updateSlot = (idx: number, field: 'open' | 'close', value: string) => {
    if (!slots) return;
    const next = slots.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
    onChange(next);
  };

  const addSlot = () => {
    if (!slots) {
      onChange([{ open: '09:00', close: '12:00' }]);
      return;
    }
    if (slots.length >= MAX_SLOTS_PER_DAY) return;
    // Euristica: se ci sono già fasce mattina (close <= 12), suggerisci pomeriggio (15-18)
    const hasMorning = slots.some((s) => s.close <= '12:00');
    const defaultSlot: LocationHoursSlot = hasMorning
      ? { open: '15:00', close: '18:00' }
      : { open: '09:00', close: '12:00' };
    onChange([...slots, defaultSlot]);
  };

  const removeSlot = (idx: number) => {
    if (!slots) return;
    const next = slots.filter((_, i) => i !== idx);
    onChange(next.length === 0 ? null : next);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-900 w-20 sm:w-24">
            <span className="sm:hidden">{dayLabelShort}</span>
            <span className="hidden sm:inline">{dayLabel}</span>
          </span>
          <label htmlFor={selectId} className="sr-only">
            Stato {dayLabel}
          </label>
          <select
            id={selectId}
            value={state}
            onChange={(e) => handleStateChange(e.target.value as 'closed' | 'open')}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="closed">Chiuso</option>
            <option value="open">Aperto</option>
          </select>
        </div>
        {state === 'open' && slots && slots.length < MAX_SLOTS_PER_DAY && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addSlot}
            leftIcon={<Plus className="h-3 w-3" aria-hidden="true" />}
          >
            Aggiungi fascia
          </Button>
        )}
      </div>
      {state === 'open' && slots && (
        <div className="space-y-2 ml-0 sm:ml-[112px]">
          {slots.map((slot, idx) => (
            <div key={idx} className="flex items-center gap-2 flex-wrap">
              <input
                type="time"
                value={slot.open}
                onChange={(e) => updateSlot(idx, 'open', e.target.value)}
                aria-label={`${dayLabel} fascia ${idx + 1} apertura`}
                className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-400 text-sm">–</span>
              <input
                type="time"
                value={slot.close}
                onChange={(e) => updateSlot(idx, 'close', e.target.value)}
                aria-label={`${dayLabel} fascia ${idx + 1} chiusura`}
                className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {slots.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSlot(idx)}
                  aria-label={`Rimuovi fascia ${idx + 1} di ${dayLabel}`}
                  className="ml-auto inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-error-600 hover:bg-error-50 transition-colors"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              {slotErrors[idx] && (
                <p className="w-full text-xs text-error-600 ml-1" role="alert">
                  {slotErrors[idx]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}