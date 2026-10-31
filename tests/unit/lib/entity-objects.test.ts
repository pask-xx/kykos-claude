import { describe, it, expect } from 'vitest';
import {
  isEntityPublished,
  OBJECT_STATUS_ON_APPROVAL,
} from '@/lib/entity-objects';

/**
 * Helper per costruire il minimo shape richiesto dal predicato.
 */
function makeObject(overrides: Partial<{ publishedByOrgId: string | null }> = {}) {
  return { publishedByOrgId: null, ...overrides };
}

describe('isEntityPublished', () => {
  it('true solo quando publishedByOrgId è valorizzato', () => {
    expect(isEntityPublished(makeObject({ publishedByOrgId: 'org_1' }))).toBe(true);
  });

  it('false per un oggetto di un donatore utente (marcatore NULL)', () => {
    expect(isEntityPublished(makeObject())).toBe(false);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
  ])('false per %s (safe-by-default)', (_label, value) => {
    expect(isEntityPublished(value as unknown as { publishedByOrgId?: string | null })).toBe(false);
  });

  it('false per stringa vuota', () => {
    expect(isEntityPublished({ publishedByOrgId: '' })).toBe(false);
  });

  it('non lancia su oggetto null/undefined', () => {
    expect(isEntityPublished(null)).toBe(false);
    expect(isEntityPublished(undefined)).toBe(false);
  });
});

describe('OBJECT_STATUS_ON_APPROVAL', () => {
  it('il donatore utente lascia l\'oggetto in RESERVED (deve ancora consegnare)', () => {
    expect(OBJECT_STATUS_ON_APPROVAL.DONOR).toBe('RESERVED');
  });

  it('l\'ente porta l\'oggetto direttamente a DEPOSITED (già in giacenza)', () => {
    expect(OBJECT_STATUS_ON_APPROVAL.ENTITY).toBe('DEPOSITED');
  });

  it('i due stati sono diversi', () => {
    expect(OBJECT_STATUS_ON_APPROVAL.DONOR).not.toBe(OBJECT_STATUS_ON_APPROVAL.ENTITY);
  });
});
