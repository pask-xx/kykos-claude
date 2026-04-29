import { describe, it, expect } from 'vitest';
import {
  generateDeliverQrCode,
  generatePickupQrCode,
  parseQrCodeData,
} from '@/lib/qrcode';

describe('QR Code Generation', () => {
  describe('generateDeliverQrCode', () => {
    it('should generate correct deliver QR data format', () => {
      const result = generateDeliverQrCode('req-123', 'user-456');
      expect(result).toBe('kykos:deliver:req-123:user-456');
    });
  });

  describe('generatePickupQrCode', () => {
    it('should generate correct pickup QR data format', () => {
      const result = generatePickupQrCode('req-123', 'user-456');
      expect(result).toBe('kykos:pickup:req-123:user-456');
    });
  });
});

describe('parseQrCodeData', () => {
  describe('deliver type', () => {
    it('should parse valid deliver QR code', () => {
      const result = parseQrCodeData('kykos:deliver:req-123:user-456');
      expect(result).toEqual({
        type: 'deliver',
        requestId: 'req-123',
        userId: 'user-456',
      });
    });

    it('should parse deliver QR with special characters in IDs', () => {
      const result = parseQrCodeData('kykos:deliver:req_abc-123:user_def-456');
      expect(result).toEqual({
        type: 'deliver',
        requestId: 'req_abc-123',
        userId: 'user_def-456',
      });
    });
  });

  describe('pickup type', () => {
    it('should parse valid pickup QR code', () => {
      const result = parseQrCodeData('kykos:pickup:req-789:ben-001');
      expect(result).toEqual({
        type: 'pickup',
        requestId: 'req-789',
        userId: 'ben-001',
      });
    });
  });

  describe('invalid formats', () => {
    it('should return null for invalid QR data', () => {
      expect(parseQrCodeData('invalid-qr-data')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseQrCodeData('')).toBeNull();
    });

    it('should return null for wrong prefix', () => {
      expect(parseQrCodeData('other:deliver:req-123:user-456')).toBeNull();
    });

    it('should return null for partial deliver format', () => {
      expect(parseQrCodeData('kykos:deliver:req-123')).toBeNull();
    });

    it('should return null for partial pickup format', () => {
      expect(parseQrCodeData('kykos:pickup:req-123')).toBeNull();
    });

    it('should return null for wrong type', () => {
      expect(parseQrCodeData('kykos:unknown:req-123:user-456')).toBeNull();
    });
  });

  describe('non-string input', () => {
    it('should return null for null input', () => {
      expect(parseQrCodeData(null as any)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(parseQrCodeData(undefined as any)).toBeNull();
    });

    it('should return null for number input', () => {
      expect(parseQrCodeData(123 as any)).toBeNull();
    });
  });
});
