import { describe, it, expect } from 'vitest';
import {
  isOfferDeliverable,
  NON_DELIVERABLE_REQUEST_STATUSES,
  type GoodsOfferShape,
} from '@/lib/goods-offer-filters';

/**
 * Helper per costruire un `GoodsOfferShape` nei test, con default sensati.
 * Tutti i campi opzionali sono omessi → true minimum shape richiesto dall'helper.
 */
function makeOffer(overrides: Partial<GoodsOfferShape> = {}): GoodsOfferShape {
  return {
    status: 'ACCEPTED',
    request: { status: 'APPROVED' },
    ...overrides,
  };
}

describe('NON_DELIVERABLE_REQUEST_STATUSES', () => {
  it('contiene esattamente FULFILLED, DELIVERED, COMPLETED, CANCELLED', () => {
    expect([...NON_DELIVERABLE_REQUEST_STATUSES].sort()).toEqual(
      ['CANCELLED', 'COMPLETED', 'DELIVERED', 'FULFILLED']
    );
  });
});

describe('isOfferDeliverable', () => {
  describe('caso del bug originale — ACCEPTED + request terminale', () => {
    it.each([
      ['DELIVERED', 'stato post-scansione operatore'],
      ['COMPLETED', 'stato post-pickup beneficiario'],
      ['FULFILLED', 'richiesta soddisfatta lato ente'],
      ['CANCELLED', 'richiesta annullata'],
    ])('ACCEPTED + request.status = %s → false (%s)', (requestStatus) => {
      const offer = makeOffer({ request: { status: requestStatus } });
      expect(isOfferDeliverable(offer)).toBe(false);
    });
  });

  describe('ACCEPTED + request ancora valida → true', () => {
    it.each([
      ['PENDING', 'in attesa approvazione ente'],
      ['APPROVED', 'stato normale'],
    ])('ACCEPTED + request.status = %s → true (%s)', (requestStatus) => {
      const offer = makeOffer({ request: { status: requestStatus } });
      expect(isOfferDeliverable(offer)).toBe(true);
    });
  });

  describe('offer.status non-accepted → sempre false', () => {
    it.each(['PENDING', 'REJECTED', 'CANCELLED'])(
      'offer.status = %s → false (anche con request APPROVED)',
      (offerStatus) => {
        const offer = makeOffer({ status: offerStatus });
        expect(isOfferDeliverable(offer)).toBe(false);
      }
    );
  });

  describe('safe-by-default su dati mancanti o invalidi', () => {
    it('request undefined → false', () => {
      const offer: GoodsOfferShape = { status: 'ACCEPTED', request: undefined };
      expect(isOfferDeliverable(offer)).toBe(false);
    });

    it('request null → false', () => {
      const offer: GoodsOfferShape = { status: 'ACCEPTED', request: null };
      expect(isOfferDeliverable(offer)).toBe(false);
    });

    it('request.status undefined → false (anche se offer è ACCEPTED)', () => {
      const offer: GoodsOfferShape = {
        status: 'ACCEPTED',
        request: { status: undefined as unknown as string },
      };
      expect(isOfferDeliverable(offer)).toBe(false);
    });

    it('request.status con typo runtime → false', () => {
      const offer = makeOffer({ request: { status: 'DELIVRED' } });
      expect(isOfferDeliverable(offer)).toBe(false);
    });

    it('offer.status con typo runtime → false (whitelist ACCEPTED)', () => {
      const offer = makeOffer({ status: 'ACCEPT' });
      expect(isOfferDeliverable(offer)).toBe(false);
    });
  });
});