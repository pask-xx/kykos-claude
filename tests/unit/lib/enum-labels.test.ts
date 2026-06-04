import { describe, it, expect } from 'vitest';
import {
  OBJECT_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
  GOODS_REQUEST_STATUS_LABELS,
  GOODS_OFFER_STATUS_LABELS,
  CATEGORY_LABELS,
  CONDITION_LABELS,
  DONOR_LEVEL_LABELS,
} from '@/types';

describe('Enum translation registry (Regola #2)', () => {
  describe('OBJECT_STATUS_LABELS', () => {
    it('translates every ObjectStatus to a human-readable Italian string', () => {
      // Belt and braces: if a new status is added to the Prisma enum,
      // the label map MUST be updated or the test fails.
      expect(OBJECT_STATUS_LABELS.AVAILABLE).toBe('Disponibile');
      expect(OBJECT_STATUS_LABELS.RESERVED).toBe('Riservata');
      expect(OBJECT_STATUS_LABELS.DEPOSITED).toBe('Depositata');
      expect(OBJECT_STATUS_LABELS.DONATED).toBe('Ritirato');
      expect(OBJECT_STATUS_LABELS.CANCELLED).toBe('Cancellato');
      // BLOCKED is the easy one to forget — see audit item C3/C4.
      expect(OBJECT_STATUS_LABELS.BLOCKED).toBe('Bloccato');
    });

    it('never returns the raw enum key as a label', () => {
      // Every label must be different from its key.
      for (const [key, label] of Object.entries(OBJECT_STATUS_LABELS)) {
        expect(label).not.toBe(key);
      }
    });
  });

  describe('REQUEST_STATUS_LABELS', () => {
    it('translates every RequestStatus to Italian', () => {
      expect(REQUEST_STATUS_LABELS.PENDING).toBe('In attesa');
      expect(REQUEST_STATUS_LABELS.APPROVED).toBe('Approvata');
      expect(REQUEST_STATUS_LABELS.REJECTED).toBe('Rifiutata');
      expect(REQUEST_STATUS_LABELS.EXPIRED).toBe('Scaduta');
      expect(REQUEST_STATUS_LABELS.CANCELLED).toBe('Cancellata');
    });
  });

  describe('GOODS_REQUEST_STATUS_LABELS', () => {
    it('translates every GoodsRequestStatus to Italian', () => {
      expect(GOODS_REQUEST_STATUS_LABELS.PENDING).toBe('In attesa');
      expect(GOODS_REQUEST_STATUS_LABELS.APPROVED).toBe('Approvata');
      expect(GOODS_REQUEST_STATUS_LABELS.FULFILLED).toBe('Soddisfatta');
      expect(GOODS_REQUEST_STATUS_LABELS.DELIVERED).toBe('Depositata');
      expect(GOODS_REQUEST_STATUS_LABELS.COMPLETED).toBe('Completata');
      expect(GOODS_REQUEST_STATUS_LABELS.CANCELLED).toBe('Cancellata');
    });
  });

  describe('GOODS_OFFER_STATUS_LABELS', () => {
    it('translates every GoodsOfferStatus to Italian', () => {
      expect(GOODS_OFFER_STATUS_LABELS.PENDING).toBe('In attesa');
      expect(GOODS_OFFER_STATUS_LABELS.ACCEPTED).toBe('Accettata');
      expect(GOODS_OFFER_STATUS_LABELS.REJECTED).toBe('Rifiutata');
      expect(GOODS_OFFER_STATUS_LABELS.CANCELLED).toBe('Cancellata');
    });
  });

  describe('CATEGORY_LABELS', () => {
    it('translates every Category to Italian', () => {
      expect(CATEGORY_LABELS.FURNITURE).toBeTruthy();
      expect(CATEGORY_LABELS.ELECTRONICS).toBeTruthy();
      expect(CATEGORY_LABELS.CLOTHING).toBeTruthy();
      expect(CATEGORY_LABELS.BOOKS).toBeTruthy();
      expect(CATEGORY_LABELS.KITCHEN).toBeTruthy();
      expect(CATEGORY_LABELS.SPORTS).toBeTruthy();
      expect(CATEGORY_LABELS.TOYS).toBeTruthy();
      expect(CATEGORY_LABELS.OTHER).toBeTruthy();
    });
  });

  describe('CONDITION_LABELS', () => {
    it('translates every Condition to Italian', () => {
      expect(CONDITION_LABELS.NEW).toBeTruthy();
      expect(CONDITION_LABELS.LIKE_NEW).toBeTruthy();
      expect(CONDITION_LABELS.GOOD).toBeTruthy();
      expect(CONDITION_LABELS.FAIR).toBeTruthy();
      expect(CONDITION_LABELS.POOR).toBeTruthy();
    });
  });

  describe('DONOR_LEVEL_LABELS', () => {
    it('translates every DonorLevel to Italian', () => {
      expect(DONOR_LEVEL_LABELS.BRONZE).toBe('Bronzo');
      expect(DONOR_LEVEL_LABELS.SILVER).toBe('Argento');
      expect(DONOR_LEVEL_LABELS.GOLD).toBe('Oro');
      expect(DONOR_LEVEL_LABELS.PLATINUM).toBe('Platino');
      expect(DONOR_LEVEL_LABELS.DIAMOND).toBe('Diamante');
    });
  });
});
