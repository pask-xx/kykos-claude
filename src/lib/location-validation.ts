import { z } from 'zod';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type LocationDayKey = (typeof DAY_KEYS)[number];

/**
 * Regex "HH:MM" in 24h: ore 00-23, minuti 00-59.
 * Validazione lato server in aggiunta al type system.
 */
const HHMM_24H = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Una fascia oraria di apertura: open/close entrambi "HH:MM".
 * Validiamo il formato in aggiunta al type per evitare payload malformati
 * salvati in JSONB.
 */
const hoursSlotSchema = z
  .object({
    open: z.string().regex(HHMM_24H, 'Orario apertura non valido (HH:MM)'),
    close: z.string().regex(HHMM_24H, 'Orario chiusura non valido (HH:MM)'),
  })
  .refine((s) => s.open < s.close, { message: 'Apertura deve essere < chiusura', path: ['open'] });

/**
 * Mappa giorno → slot orario o null (chiuso).
 * Object: chiavi sono i 7 giorni, ogni valore è lo slot o null.
 */
const hoursMapSchema = z
  .object({
    monday: hoursSlotSchema.nullable().optional(),
    tuesday: hoursSlotSchema.nullable().optional(),
    wednesday: hoursSlotSchema.nullable().optional(),
    thursday: hoursSlotSchema.nullable().optional(),
    friday: hoursSlotSchema.nullable().optional(),
    saturday: hoursSlotSchema.nullable().optional(),
    sunday: hoursSlotSchema.nullable().optional(),
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
