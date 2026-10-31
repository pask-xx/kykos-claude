import { describe, it, expect } from 'vitest';
import {
  entityHistoryPeriodRange,
  filterEntityHistory,
  groupEntityHistoryByDate,
  localDateKey,
  parseLocalDateBoundary,
  resolveEntityDeliveredAt,
  type EntityHistoryItem,
  type EntityHistoryPeriod,
} from '@/lib/entity-history';

/**
 * Helper per costruire una riga di storico minimale.
 */
function makeItem(overrides: Partial<EntityHistoryItem> = {}): EntityHistoryItem {
  return {
    id: 'obj_1',
    title: 'Sedia in legno',
    description: 'Oggetto donato',
    category: 'FURNITURE',
    condition: 'GOOD',
    imageUrls: null,
    depositLocation: '(S): MAGAZZINO - (S): A-12',
    createdAt: new Date(2026, 9, 20, 10, 0, 0).toISOString(),
    deliveredAt: new Date(2026, 9, 31, 9, 30, 0).toISOString(),
    ...overrides,
  };
}

describe('resolveEntityDeliveredAt', () => {
  it('usa Donation.deliveredAt quando è valorizzata', () => {
    const donationDate = new Date(2026, 9, 31, 15, 0, 0);
    const updatedAt = new Date(2026, 9, 20, 10, 0, 0);
    expect(resolveEntityDeliveredAt(donationDate, updatedAt)).toBe(donationDate.toISOString());
  });

  it('fallback su Object.updatedAt quando deliveredAt è null', () => {
    const updatedAt = new Date(2026, 9, 20, 10, 0, 0);
    expect(resolveEntityDeliveredAt(null, updatedAt)).toBe(updatedAt.toISOString());
  });

  it('fallback su Object.updatedAt quando deliveredAt non è una data valida', () => {
    const updatedAt = new Date(2026, 9, 20, 10, 0, 0);
    expect(resolveEntityDeliveredAt('non-una-data', updatedAt)).toBe(updatedAt.toISOString());
  });

  it('accetta anche una stringa ISO', () => {
    const donationDate = new Date(2026, 9, 31, 15, 0, 0);
    const updatedAt = new Date(2026, 9, 20, 10, 0, 0);
    expect(resolveEntityDeliveredAt(donationDate.toISOString(), updatedAt)).toBe(
      donationDate.toISOString()
    );
  });
});

describe('entityHistoryPeriodRange', () => {
  const now = new Date(2026, 9, 31, 12, 0, 0);

  it('ALL non mette limiti', () => {
    expect(entityHistoryPeriodRange('ALL', now)).toBeNull();
  });

  it('CURRENT_YEAR parte dal 1° gennaio dell\'anno', () => {
    const range = entityHistoryPeriodRange('CURRENT_YEAR', now)!;
    expect(range.from.getFullYear()).toBe(2026);
    expect(range.from.getMonth()).toBe(0);
    expect(range.from.getDate()).toBe(1);
    expect(range.from.getHours()).toBe(0);
  });

  it('CURRENT_YEAR finisce a fine giornata di oggi', () => {
    const range = entityHistoryPeriodRange('CURRENT_YEAR', now)!;
    expect(range.to.getFullYear()).toBe(2026);
    expect(range.to.getMonth()).toBe(9);
    expect(range.to.getDate()).toBe(31);
    expect(range.to.getHours()).toBe(23);
    expect(range.to.getMinutes()).toBe(59);
  });

  it('LAST_30_DAYS parte da 30 giorni fa a mezzanotte', () => {
    const range = entityHistoryPeriodRange('LAST_30_DAYS', now)!;
    expect(range.from.getMonth()).toBe(9);
    expect(range.from.getDate()).toBe(1);
    expect(range.from.getHours()).toBe(0);
  });

  it('LAST_90_DAYS parte da 90 giorni fa a mezzanotte', () => {
    const range = entityHistoryPeriodRange('LAST_90_DAYS', now)!;
    expect(range.from.getMonth()).toBe(7);
    expect(range.from.getDate()).toBe(2);
    expect(range.from.getHours()).toBe(0);
  });
});

describe('filterEntityHistory', () => {
  const now = new Date(2026, 9, 31, 12, 0, 0);

  it('senza filtri restituisce tutto', () => {
    const items = [makeItem(), makeItem({ id: 'obj_2' })];
    expect(filterEntityHistory(items)).toHaveLength(2);
  });

  it('filtra per testo su titolo, descrizione e posizione (case-insensitive)', () => {
    const items = [
      makeItem({ id: 'a', title: 'Sedia in legno' }),
      makeItem({ id: 'b', title: 'Tavolo', description: 'Tavolo da pranzo' }),
      makeItem({ id: 'c', title: 'Armadio', depositLocation: '(S): DEPOSITO - (P): 2' }),
    ];

    expect(filterEntityHistory(items, { search: 'SEDIA' }).map((i) => i.id)).toEqual(['a']);
    expect(filterEntityHistory(items, { search: 'pranzo' }).map((i) => i.id)).toEqual(['b']);
    expect(filterEntityHistory(items, { search: 'deposito' }).map((i) => i.id)).toEqual(['c']);
  });

  it('ignora spazi bianchi nella ricerca', () => {
    const items = [makeItem({ title: 'Sedia in legno' })];
    expect(filterEntityHistory(items, { search: '  sedia  ' })).toHaveLength(1);
  });

  it('filtra per categoria', () => {
    const items = [
      makeItem({ id: 'a', category: 'FURNITURE' }),
      makeItem({ id: 'b', category: 'BOOKS' }),
    ];
    expect(filterEntityHistory(items, { category: 'BOOKS' }).map((i) => i.id)).toEqual(['b']);
  });

  it('"ALL" e null non filtrano per categoria', () => {
    const items = [makeItem({ id: 'a' }), makeItem({ id: 'b', category: 'BOOKS' })];
    expect(filterEntityHistory(items, { category: 'ALL' })).toHaveLength(2);
    expect(filterEntityHistory(items, { category: null })).toHaveLength(2);
  });

  it('filtra per periodo di consegna', () => {
    const items = [
      makeItem({ id: 'recent', deliveredAt: new Date(2026, 9, 20, 9, 0, 0).toISOString() }),
      makeItem({ id: 'old', deliveredAt: new Date(2025, 0, 10, 9, 0, 0).toISOString() }),
    ];

    expect(
      filterEntityHistory(items, { period: 'LAST_30_DAYS', now }).map((i) => i.id)
    ).toEqual(['recent']);
    expect(
      filterEntityHistory(items, { period: 'CURRENT_YEAR', now }).map((i) => i.id)
    ).toEqual(['recent']);
  });

  it('combina i filtri', () => {
    const items = [
      makeItem({ id: 'match', title: 'Sedia', category: 'FURNITURE' }),
      makeItem({ id: 'wrong-category', title: 'Sedia', category: 'BOOKS' }),
      makeItem({ id: 'wrong-text', title: 'Tavolo', category: 'FURNITURE' }),
    ];

    const result = filterEntityHistory(items, { search: 'sedia', category: 'FURNITURE' });
    expect(result.map((i) => i.id)).toEqual(['match']);
  });
});

describe('groupEntityHistoryByDate', () => {
  it('raggruppa per giorno locale, dalla data più recente alla più vecchia', () => {
    const items = [
      makeItem({ id: 'a', deliveredAt: new Date(2026, 9, 31, 9, 0, 0).toISOString() }),
      makeItem({ id: 'b', deliveredAt: new Date(2026, 9, 31, 18, 0, 0).toISOString() }),
      makeItem({ id: 'c', deliveredAt: new Date(2026, 9, 30, 9, 0, 0).toISOString() }),
    ];

    const groups = groupEntityHistoryByDate(items);
    expect(groups).toHaveLength(2);
    expect(groups[0].items.map((i) => i.id)).toEqual(['b', 'a']);
    expect(groups[1].items.map((i) => i.id)).toEqual(['c']);
  });

  it('la chiave del gruppo è la data locale YYYY-MM-DD', () => {
    const date = new Date(2026, 9, 31, 23, 30, 0);
    expect(localDateKey(date)).toBe('2026-10-31');

    const groups = groupEntityHistoryByDate([makeItem({ deliveredAt: date.toISOString() })]);
    expect(groups[0].dateKey).toBe('2026-10-31');
  });

  it('la label del gruppo è in italiano', () => {
    const groups = groupEntityHistoryByDate([
      makeItem({ deliveredAt: new Date(2026, 9, 31, 9, 0, 0).toISOString() }),
    ]);
    expect(groups[0].label).toContain('ottobre');
    expect(groups[0].label).toContain('2026');
  });

  it('gruppo vuoto per lista vuota', () => {
    expect(groupEntityHistoryByDate([])).toEqual([]);
  });
});

describe('parseLocalDateBoundary', () => {
  it('parsing di una data valida all\'inizio del giorno', () => {
    const date = parseLocalDateBoundary('2026-10-31', false)!;
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(9);
    expect(date.getDate()).toBe(31);
    expect(date.getHours()).toBe(0);
  });

  it('parsing di una data valida a fine giornata', () => {
    const date = parseLocalDateBoundary('2026-10-31', true)!;
    expect(date.getHours()).toBe(23);
    expect(date.getMinutes()).toBe(59);
    expect(date.getSeconds()).toBe(59);
  });

  it('restituisce null per valori non validi', () => {
    expect(parseLocalDateBoundary(null, false)).toBeNull();
    expect(parseLocalDateBoundary(undefined, false)).toBeNull();
    expect(parseLocalDateBoundary('', false)).toBeNull();
    expect(parseLocalDateBoundary('31/10/2026', false)).toBeNull();
    expect(parseLocalDateBoundary('non-una-data', false)).toBeNull();
  });
});

describe('EntityHistoryPeriod', () => {
  it('i periodi esposti sono quelli supportati dai filtri', () => {
    const periods: EntityHistoryPeriod[] = ['ALL', 'LAST_30_DAYS', 'LAST_90_DAYS', 'CURRENT_YEAR'];
    expect(periods).toHaveLength(4);
  });
});
