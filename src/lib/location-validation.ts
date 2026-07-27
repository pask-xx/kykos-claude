import { z } from 'zod';
import type { LocationHours, LocationHoursSlot, LocationDayKey } from '@/types';
import { LOCATION_DAY_KEYS } from '@/types';

export type { LocationDayKey };

/**
 * Regex "HH:MM" in 24h: ore 00-23, minuti 00-59.
 * Validazione lato server in aggiunta al type system.
 */
const HHMM_24H = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Una fascia oraria di apertura: open/close entrambi "HH:MM".
 * Validiamo il formato in aggiunta al type per evitare payload malformati
 * salvati in JSONB.
 *
 * Vincoli:
 * - formato HH:MM 24h (regex)
 * - open < close (no slot a cavallo mezzanotte; si potrebbe aggiungere in futuro)
 */
const hoursSlotSchema = z
  .object({
    open: z.string().regex(HHMM_24H, 'Orario apertura non valido (HH:MM)'),
    close: z.string().regex(HHMM_24H, 'Orario chiusura non valido (HH:MM)'),
  })
  .refine((s) => s.open < s.close, {
    message: 'Apertura deve essere < chiusura',
    path: ['open'],
  });

/**
 * Array di fasce orarie per un giorno (max 4, no overlap).
 *
 * Regole:
 * - max 4 fasce/giorno (mattina, pomeriggio, sera, notte)
 * - no overlap fra fasce dello stesso giorno (sorted-by-open check)
 */
const hoursArraySchema = z
  .array(hoursSlotSchema)
  .max(4, 'Massimo 4 fasce orarie per giorno')
  .superRefine((slots, ctx) => {
    if (slots.length < 2) return;
    const sorted = [...slots].sort((a, b) => a.open.localeCompare(b.open));
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].open < sorted[i - 1].close) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Le fasce orarie non possono sovrapporsi',
          path: [i, 'open'],
        });
      }
    }
  });

/**
 * Mappa giorno → array di fasce orarie (o null se chiuso/non specificato).
 * Object: chiavi sono i 7 giorni, ogni valore è l'array o null.
 */
const hoursMapSchema = z
  .object({
    monday: hoursArraySchema.nullable().optional(),
    tuesday: hoursArraySchema.nullable().optional(),
    wednesday: hoursArraySchema.nullable().optional(),
    thursday: hoursArraySchema.nullable().optional(),
    friday: hoursArraySchema.nullable().optional(),
    saturday: hoursArraySchema.nullable().optional(),
    sunday: hoursArraySchema.nullable().optional(),
  })
  .strict() // rifiuta chiavi sconosciute (es. typo)
  .nullable()
  .optional();

/**
 * Schema completo per create/update Location.
 * Validato lato server anche se la UI già filtra — difesa in profondità.
 *
 * Note retrocompatibilità:
 * - `kind` NON accettato: la v1 prevede solo COLLECTION_POINT.
 *   La sede principale resta su Organization, NON una Location.
 * - `organizationId` NON accettato: dedotto dalla session (no spoofing).
 * - `isActive` NON accettato in create (default true);
 *   modificabile solo via DELETE (soft-delete).
 */
export const locationInputSchema = z.object({
  address: z.string().min(1, 'Indirizzo richiesto').max(200),
  city: z.string().min(1, 'Città richiesta').max(100),
  postalCode: z
    .string()
    .min(1, 'CAP richiesto')
    .max(10)
    .regex(/^\d{4,10}$/, 'CAP non valido'),
  province: z
    .string()
    .max(10)
    .regex(/^[A-Za-z]{0,2}$/, 'Sigla provincia non valida (2 lettere)')
    .optional()
    .or(z.literal('')),
  country: z.string().length(2, 'Paese: 2 lettere (ISO)').default('IT'),
  latitude: z
    .number({ error: 'Latitudine non valida' })
    .min(-90, 'Latitudine fuori range')
    .max(90, 'Latitudine fuori range'),
  longitude: z
    .number({ error: 'Longitudine non valida' })
    .min(-180, 'Longitudine fuori range')
    .max(180, 'Longitudine fuori range'),
  hours: hoursMapSchema,
  notes: z.string().max(2000, 'Note troppo lunghe (max 2000 caratteri)').optional(),
});

export type LocationInput = z.infer<typeof locationInputSchema>;

/**
 * Valida e parsa il body JSON di una request Location.
 * Ritorna `{ success: true, data }` o `{ success: false, error }`.
 */
export function parseLocationInput(body: unknown):
  | { success: true; data: LocationInput }
  | { success: false; error: string } {
  const parsed = locationInputSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue.path.join('.');
    return {
      success: false,
      error: path ? `${path}: ${issue.message}` : issue.message,
    };
  }
  // Normalizza: rimuovi stringa vuota da province (zod trasforma '' a undefined)
  const data: LocationInput = {
    ...parsed.data,
    province: parsed.data.province === '' ? undefined : parsed.data.province,
  };
  return { success: true, data };
}

// =============================================================
// Organization hours + notes (stessa shape di Location)
// =============================================================

/** Stesso schema di Location.hours (multi-slot per giorno). */
export const organizationHoursInputSchema = hoursMapSchema;

/** Note libere sede principale: plain text, max 2000 caratteri. */
export const organizationNotesSchema = z.string().max(2000, 'Note troppo lunghe (max 2000 caratteri)').optional();

// =============================================================
// normalizeLocationHours — retro-compat single-slot legacy
// =============================================================

/**
 * Normalizza un LocationHours letto dal DB in shape v2 (array di slot).
 *
 * Casi gestiti:
 * - `null` / `undefined` → `null`
 * - shape v2 (array di slot) → invariato
 * - shape legacy single-slot `{open, close}` → wrappa in array `[{open, close}]`
 * - oggetto con giorni misti (alcuni v2, alcuni legacy) → normalizza per ciascun giorno
 * - valore non-oggetto / null per giorni sconosciuti → null per quel giorno
 *
 * Usato in tutti i punti di lettura per garantire retro-compat con record
 * pre-migration (single-slot JSON).
 */
export function normalizeLocationHours(raw: unknown): LocationHours | null {
  if (raw == null) return null;
  if (typeof raw !== 'object') return null;
  const out: LocationHours = {};
  for (const day of LOCATION_DAY_KEYS) {
    const v = (raw as Record<string, unknown>)[day];
    if (v == null) {
      out[day] = null; // chiuso / non specificato
    } else if (Array.isArray(v)) {
      // shape v2 (array di slot) — filtra slot invalidi ma preserva array
      out[day] = (v as LocationHoursSlot[]).filter(
        (s) => s && typeof s.open === 'string' && typeof s.close === 'string'
      );
    } else if (typeof v === 'object' && 'open' in v && 'close' in v) {
      // legacy single-slot → wrappa in array
      const legacy = v as LocationHoursSlot;
      if (typeof legacy.open === 'string' && typeof legacy.close === 'string') {
        out[day] = [legacy];
      } else {
        out[day] = null;
      }
    } else {
      out[day] = null;
    }
  }
  return out;
}