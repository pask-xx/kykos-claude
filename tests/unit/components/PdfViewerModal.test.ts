import { describe, it, expect } from 'vitest';
import { deriveFilename } from '@/components/PdfViewerModal';

describe('deriveFilename', () => {
  describe('Privacy document titles', () => {
    it('derives kykos-privacy-v1.0.pdf from "Informativa Privacy v1.0"', () => {
      expect(deriveFilename('Informativa Privacy v1.0')).toBe('kykos-privacy-v1.0.pdf');
    });

    it('derives kykos-privacy-v1.1.pdf from "Informativa Privacy v1.1"', () => {
      expect(deriveFilename('Informativa Privacy v1.1')).toBe('kykos-privacy-v1.1.pdf');
    });

    it('handles 3-part semver (1.2.3)', () => {
      expect(deriveFilename('Informativa Privacy v1.2.3')).toBe('kykos-privacy-v1.2.3.pdf');
    });
  });

  describe('Terms document titles', () => {
    it('derives kykos-terms-v1.0.pdf from "Condizioni d\'uso v1.0"', () => {
      expect(deriveFilename("Condizioni d'uso v1.0")).toBe('kykos-terms-v1.0.pdf');
    });

    it('derives kykos-terms-v1.0.pdf from "Termini di Servizio v1.0"', () => {
      expect(deriveFilename('Termini di Servizio v1.0')).toBe('kykos-terms-v1.0.pdf');
    });

    it('handles 3-part semver', () => {
      expect(deriveFilename("Condizioni d'uso v2.0.1")).toBe('kykos-terms-v2.0.1.pdf');
    });
  });

  describe('Edge cases', () => {
    it('returns null for title without version', () => {
      expect(deriveFilename('Informativa Privacy')).toBeNull();
    });

    it('returns null for title without recognized type', () => {
      expect(deriveFilename('Cookie Policy v1.0')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(deriveFilename('')).toBeNull();
    });

    it('is case-insensitive on type detection (lowercase title)', () => {
      expect(deriveFilename('informativa privacy v1.0')).toBe('kykos-privacy-v1.0.pdf');
    });
  });
});
