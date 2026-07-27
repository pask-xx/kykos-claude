/**
 * Test per `src/lib/location-validation.ts`.
 *
 * Focus:
 * - `normalizeLocationHours()` su shape legacy single-slot, v2 array, null,
 *   e casi degeneri (non-oggetto).
 * - `locationInputSchema` Zod: orari validi, slot invalidi (open >= close),
 *   overlap fra slot, note troppo lunghe, province vuota.
 */
import { describe, it, expect } from 'vitest';
import {
  normalizeLocationHours,
  locationInputSchema,
  organizationHoursInputSchema,
  organizationNotesSchema,
} from '@/lib/location-validation';

describe('normalizeLocationHours', () => {
  it('ritorna null per null/undefined', () => {
    expect(normalizeLocationHours(null)).toBeNull();
    expect(normalizeLocationHours(undefined)).toBeNull();
  });

  it('ritorna null per valore non-oggetto', () => {
    expect(normalizeLocationHours('foo' as unknown)).toBeNull();
    expect(normalizeLocationHours(42 as unknown)).toBeNull();
  });

  it('wrappa uno slot legacy single-slot in array', () => {
    const result = normalizeLocationHours({
      monday: { open: '09:00', close: '18:00' },
    });
    expect(result?.monday).toEqual([{ open: '09:00', close: '18:00' }]);
  });

  it('preserva array v2 invariato', () => {
    const raw = {
      monday: [
        { open: '09:00', close: '12:00' },
        { open: '15:00', close: '18:00' },
      ],
    };
    const result = normalizeLocationHours(raw);
    expect(result?.monday).toEqual(raw.monday);
  });

  it('normalizza giorni misti (legacy + v2 + null)', () => {
    const result = normalizeLocationHours({
      monday: { open: '09:00', close: '18:00' }, // legacy → array
      tuesday: [{ open: '10:00', close: '13:00' }], // v2
      wednesday: null, // esplicito
    });
    expect(result?.monday).toEqual([{ open: '09:00', close: '18:00' }]);
    expect(result?.tuesday).toEqual([{ open: '10:00', close: '13:00' }]);
    expect(result?.wednesday).toBeNull();
  });

  it('giorni non presenti sono lasciati null nel risultato', () => {
    const result = normalizeLocationHours({
      monday: { open: '09:00', close: '18:00' },
    });
    expect(result?.monday).toBeDefined();
    expect(result?.sunday).toBeNull();
  });

  it('filtra slot v2 con campi non-stringa', () => {
    const result = normalizeLocationHours({
      monday: [
        { open: '09:00', close: '12:00' },
        { open: 15 as unknown as string, close: '18:00' }, // invalido
      ],
    });
    expect(result?.monday).toEqual([{ open: '09:00', close: '12:00' }]);
  });
});

describe('locationInputSchema Zod', () => {
  const baseValid = {
    address: 'Via Roma 1',
    city: 'Milano',
    postalCode: '20100',
    country: 'IT',
    latitude: 45.4,
    longitude: 9.2,
  };

  it('accetta un input valido con hours array v2', () => {
    const result = locationInputSchema.safeParse({
      ...baseValid,
      hours: { monday: [{ open: '09:00', close: '18:00' }] },
      notes: 'Suonare il campanello',
    });
    expect(result.success).toBe(true);
  });

  it('rifiuta slot con open >= close', () => {
    const result = locationInputSchema.safeParse({
      ...baseValid,
      hours: { monday: [{ open: '18:00', close: '09:00' }] },
    });
    expect(result.success).toBe(false);
  });

  it('rifiuta slot sovrapposti nello stesso giorno', () => {
    const result = locationInputSchema.safeParse({
      ...baseValid,
      hours: {
        monday: [
          { open: '09:00', close: '13:00' },
          { open: '12:00', close: '16:00' }, // overlap con 9-13
        ],
      },
    });
    expect(result.success).toBe(false);
  });

  it('accetta più slot non sovrapposti nello stesso giorno', () => {
    const result = locationInputSchema.safeParse({
      ...baseValid,
      hours: {
        monday: [
          { open: '09:00', close: '12:00' },
          { open: '15:00', close: '18:00' },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it('accetta hours: null (sede senza orari)', () => {
    const result = locationInputSchema.safeParse({
      ...baseValid,
      hours: null,
    });
    expect(result.success).toBe(true);
  });

  it('accetta hours: undefined', () => {
    const result = locationInputSchema.safeParse({
      ...baseValid,
    });
    expect(result.success).toBe(true);
  });

  it('rifiuta note > 2000 caratteri', () => {
    const result = locationInputSchema.safeParse({
      ...baseValid,
      notes: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('accetta province vuota (normalizzata a undefined in parseLocationInput)', () => {
    const result = locationInputSchema.safeParse({
      ...baseValid,
      province: '',
    });
    expect(result.success).toBe(true);
  });
});

describe('organizationHoursInputSchema', () => {
  it('è equivalente a hoursMapSchema (accetta null/array)', () => {
    expect(organizationHoursInputSchema.safeParse(null).success).toBe(true);
    expect(
      organizationHoursInputSchema.safeParse({
        monday: [{ open: '09:00', close: '18:00' }],
      }).success
    ).toBe(true);
  });
});

describe('organizationNotesSchema', () => {
  it('accetta note libere', () => {
    expect(organizationNotesSchema.safeParse('Suonare il campanello').success).toBe(true);
  });

  it('rifiuta note > 2000 caratteri', () => {
    expect(organizationNotesSchema.safeParse('a'.repeat(2001)).success).toBe(false);
  });
});