import { describe, it, expect } from 'vitest';
import { getStoragePath } from '@/lib/legal';

/**
 * getStoragePath è la single source of truth per il path canonico di un
 * documento legale nel bucket Supabase Storage. Pattern:
 * `documents/kykos-{type}-v{version}.pdf`.
 *
 * Vedi: src/lib/legal.ts (esportata per consentire ai call site come
 * `src/app/api/admin/legal/upload/route.ts` di non duplicare l'inline).
 *
 * Test focalizzati sul path: la coerenza tra download URL e filename del
 * file scaricato dipende dal path bucket. Se cambiamo il pattern, TUTTI i
 * download ereditano il nuovo formato automaticamente (browser usa il nome
 * del file dal Content-Disposition).
 */
describe('getStoragePath', () => {
  describe('Privacy documents', () => {
    it('builds kykos-privacy-v1.0.pdf', () => {
      expect(getStoragePath('PRIVACY', '1.0')).toBe('documents/kykos-privacy-v1.0.pdf');
    });

    it('builds kykos-privacy-v1.1.pdf', () => {
      expect(getStoragePath('PRIVACY', '1.1')).toBe('documents/kykos-privacy-v1.1.pdf');
    });

    it('supports 3-part semver', () => {
      expect(getStoragePath('PRIVACY', '1.2.3')).toBe('documents/kykos-privacy-v1.2.3.pdf');
    });
  });

  describe('Terms documents', () => {
    it('builds kykos-terms-v1.0.pdf', () => {
      expect(getStoragePath('TERMS', '1.0')).toBe('documents/kykos-terms-v1.0.pdf');
    });

    it('builds kykos-terms-v2.0.pdf', () => {
      expect(getStoragePath('TERMS', '2.0')).toBe('documents/kykos-terms-v2.0.pdf');
    });
  });

  describe('Consistency checks', () => {
    it('lowercases the type (TERMS → terms, PRIVACY → privacy)', () => {
      // Anche se "PRIVACY" è già uppercase, garantiamo che type.toLowerCase()
      // viene applicato — sicurezza contro futuri bug di casing.
      expect(getStoragePath('PRIVACY', '1.0')).toContain('privacy');
      expect(getStoragePath('TERMS', '1.0')).toContain('terms');
    });

    it('keeps version unchanged (no lowercasing)', () => {
      // Le versioni sono "1.0", "1.2.3" — se mai arrivassero "1.0-BETA"
      // vogliamo preservare il case originale.
      expect(getStoragePath('PRIVACY', '2.0-BETA')).toBe('documents/kykos-privacy-v2.0-BETA.pdf');
    });

    it('path is stable and well-formed (no spaces, no double slashes)', () => {
      const path = getStoragePath('PRIVACY', '1.0');
      expect(path).not.toMatch(/\s/);
      expect(path).not.toMatch(/\/\//);
      expect(path.startsWith('documents/')).toBe(true);
      expect(path.endsWith('.pdf')).toBe(true);
    });
  });
});
