/**
 * Test per Fase C: POST /api/requests include sede suggerita + lista sedi.
 *
 * Scope: il route, dopo la transazione di creazione request+donation,
 * calcola la sede suggerita (tramite suggestLocationForTransaction) e:
 *   1. Ritorna `locationSuggestion` (suggested + allLocations) nella response
 *   2. Passa il blocco HTML "sede consigliata + altre sedi" a sendDeliveryQrNotification
 *      o sendRequestNotification
 *
 * Casi coperti:
 *   - AUTO-APPROVE: response include locationSuggestion, email QR include il blocco
 *   - PENDING: response include locationSuggestion, email request include il blocco
 *   - Nessuna sede (ente senza main e senza location): locationSuggestion = {suggested: null, allLocations: []}
 *   - Sede principale + N sedi aggiuntive: ordinamento per score, donatore vicino a una
 *     delle sedi aggiuntive
 *   - Donatore/beneficiario senza coordinate: fallback ragionevole (solo main)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('jose', () => ({ jwtVerify: vi.fn() }));

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { POST } from '@/app/api/requests/route';
import { mockPrisma, resetAllMocks } from '../../setup/mocks';
import { sendRequestNotification, sendDeliveryQrNotification } from '@/lib/email';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);
const mockSendRequest = vi.mocked(sendRequestNotification);
const mockSendDeliveryQr = vi.mocked(sendDeliveryQrNotification);

const RECIPIENT_ID = 'r-1';
const OBJECT_ID = 'obj-1';
const INTERMEDIARY_ID = 'i-1';
const DONOR_ID = 'd-1';

function buildRequest(objectId: string, message?: string) {
  return new Request('http://localhost/api/requests', {
    method: 'POST',
    body: JSON.stringify(message !== undefined ? { objectId, message } : { objectId }),
    headers: { 'Content-Type': 'application/json' },
  });
}

async function authAsAuthorizedRecipient() {
  mockCookies.mockImplementation(async () => ({
    get: (name: string) => (name === 'session' ? { value: 'valid' } : undefined),
    delete: () => undefined,
  }) as any);
  mockJwtVerify.mockImplementation(async () => ({
    payload: { user: { id: RECIPIENT_ID, email: 'r@test.it', name: 'Recipient', role: 'RECIPIENT' } },
  }) as any);
  // user.findUnique viene chiamata 3 volte:
  // 1) auth check (select: { authorized: true })
  // 2) Fase C: coordinate donatore (select: { latitude, longitude })
  // 3) Fase C: coordinate beneficiario (select: { latitude, longitude })
  mockPrisma.user.findUnique.mockImplementation(async (args: any) => {
    if (args?.select?.authorized !== undefined) {
      return { authorized: true };
    }
    if (args?.where?.id === RECIPIENT_ID) {
      // Beneficiario: coordinate per suggestLocation
      return { latitude: 41.9, longitude: 12.5 };
    }
    if (args?.where?.id === DONOR_ID) {
      // Donatore: coordinate per suggestLocation
      return { latitude: 41.95, longitude: 12.6 };
    }
    return null;
  });
}

function setupAvailableObject(opts: { autoApprove?: boolean; objectId?: string } = {}) {
  const oid = opts.objectId ?? OBJECT_ID;
  mockPrisma.object.findUnique.mockImplementation(async (args: any) => {
    if (args?.where?.id === oid) {
      return {
        id: oid,
        title: 'Sedia',
        status: 'AVAILABLE',
        donorId: DONOR_ID,
        intermediaryId: INTERMEDIARY_ID,
        intermediary: {
          id: INTERMEDIARY_ID,
          name: 'Caritas',
          autoApproveRequests: opts.autoApprove ?? false,
          address: 'Via Roma',
          houseNumber: '1',
          cap: '00100',
          city: 'Roma',
          province: 'RM',
          phone: '0612345678',
          email: 'info@caritas.it',
          hoursInfo: '9-12',
        },
      };
    }
    return null;
  });
}

beforeEach(() => {
  resetAllMocks();
  mockCookies.mockReset();
  mockJwtVerify.mockReset();
  mockSendRequest.mockClear();
  mockSendDeliveryQr.mockClear();

  // Default: no existing request
  mockPrisma.request.findFirst.mockImplementation(async () => null);

  // Default: l'ente ha sede principale a Roma
  mockPrisma.organization.findUnique.mockImplementation(async () => ({
    id: INTERMEDIARY_ID,
    name: 'Caritas',
    address: 'Via Roma',
    city: 'Roma',
    latitude: 41.9,
    longitude: 12.5,
    hoursInfo: '9-12',
  }));
  // Default: nessuna sede aggiuntiva (test singoli override se serve)
  mockPrisma.location.findMany.mockImplementation(async () => []);
});

describe('POST /api/requests — Fase C: location suggestion', () => {
  it('AUTO-APPROVE: response include locationSuggestion con sede principale suggerita', async () => {
    await authAsAuthorizedRecipient();
    setupAvailableObject({ autoApprove: true });

    mockPrisma.object.updateMany.mockImplementation(async () => ({ count: 1 }));
    mockPrisma.request.create.mockImplementation(async (args: any) => ({
      id: 'req-1',
      objectId: args.data.objectId,
      recipientId: args.data.recipientId,
      intermediaryId: args.data.intermediaryId,
      message: args.data.message,
      status: args.data.status,
      object: {
        id: OBJECT_ID,
        title: 'Sedia',
        donorId: DONOR_ID,
        donor: { id: DONOR_ID, name: 'Donor', email: 'd@test.it' },
      },
    }));
    mockPrisma.donation.create.mockImplementation(async (args: any) => ({ id: 'don-1', ...args.data }));

    const response = await POST(buildRequest(OBJECT_ID), undefined as any);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.locationSuggestion).toBeDefined();
    expect(body.locationSuggestion.suggested).not.toBeNull();
    expect(body.locationSuggestion.suggested.kind).toBe('MAIN');
    expect(body.locationSuggestion.suggested.id).toBe(`main:${INTERMEDIARY_ID}`);
    expect(body.locationSuggestion.allLocations).toHaveLength(1);

    // Anche la chiamata email QR deve includere il blocco HTML delle sedi
    // (locationSuggestionBlock è l'ultimo parametro opzionale, indice 15)
    expect(mockSendDeliveryQr).toHaveBeenCalledTimes(1);
    const emailArgs = mockSendDeliveryQr.mock.calls[0];
    const block = emailArgs[15] as string;
    expect(block).toContain('Sede consigliata');
    // Display name della sede principale (Via Roma, Roma)
    expect(block).toContain('Via Roma, Roma');
  });

  it('PENDING: response include locationSuggestion, email request include il blocco', async () => {
    await authAsAuthorizedRecipient();
    setupAvailableObject({ autoApprove: false });

    mockPrisma.request.create.mockImplementation(async (args: any) => ({
      id: 'req-1',
      objectId: args.data.objectId,
      recipientId: args.data.recipientId,
      intermediaryId: args.data.intermediaryId,
      message: args.data.message,
      status: args.data.status,
      object: {
        id: OBJECT_ID,
        title: 'Sedia',
        donorId: DONOR_ID,
        donor: { id: DONOR_ID, name: 'Donor', email: 'd@test.it' },
      },
    }));

    const response = await POST(buildRequest(OBJECT_ID), undefined as any);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.locationSuggestion).toBeDefined();
    expect(body.locationSuggestion.suggested).not.toBeNull();
    expect(body.locationSuggestion.suggested.kind).toBe('MAIN');

    // Email request (NON QR) include il blocco
    expect(mockSendRequest).toHaveBeenCalledTimes(1);
    const emailArgs = mockSendRequest.mock.calls[0];
    // Indice 5 = locationSuggestionBlock (vedi firma aggiornata)
    const block = emailArgs[5] as string;
    expect(block).toContain('Sede consigliata');
  });

  it('ente senza sedi: locationSuggestion vuoto, blocco email vuoto (nessuna sezione)', async () => {
    await authAsAuthorizedRecipient();
    setupAvailableObject({ autoApprove: true });

    // Ente senza sede principale E senza sedi aggiuntive
    mockPrisma.organization.findUnique.mockImplementation(async () => null);
    mockPrisma.location.findMany.mockImplementation(async () => []);

    mockPrisma.object.updateMany.mockImplementation(async () => ({ count: 1 }));
    mockPrisma.request.create.mockImplementation(async (args: any) => ({
      id: 'req-1',
      objectId: args.data.objectId,
      recipientId: args.data.recipientId,
      intermediaryId: args.data.intermediaryId,
      message: args.data.message,
      status: args.data.status,
      object: {
        id: OBJECT_ID,
        title: 'Sedia',
        donorId: DONOR_ID,
        donor: { id: DONOR_ID, name: 'Donor', email: 'd@test.it' },
      },
    }));
    mockPrisma.donation.create.mockImplementation(async (args: any) => ({ id: 'don-1', ...args.data }));

    const response = await POST(buildRequest(OBJECT_ID), undefined as any);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.locationSuggestion.suggested).toBeNull();
    expect(body.locationSuggestion.allLocations).toEqual([]);

    // Email QR: blocco vuoto (stringa vuota), nessuna sezione "Sede consigliata"
    expect(mockSendDeliveryQr).toHaveBeenCalledTimes(1);
    const block = mockSendDeliveryQr.mock.calls[0][15] as string;
    expect(block).toBe('');
  });

  it('ente con 2 sedi aggiuntive: ordinamento per score, donatore vicino a una di esse', async () => {
    await authAsAuthorizedRecipient();
    setupAvailableObject({ autoApprove: true });

    // Donatore è a Roma Nord (vicino a loc-near-donor).
    // loc-near-donor: Roma Nord @ (41.95, 12.6) → distanza 0 dal donatore.
    // loc-far: Milano @ (45.4, 9.2) → distanza ~480km dal donatore.
    // Vincente atteso: loc-near-donor (score minore)
    mockPrisma.location.findMany.mockImplementation(async () => [
      {
        id: 'loc-far',
        kind: 'COLLECTION_POINT',
        address: 'Via Milano',
        city: 'Milano',
        postalCode: '20100',
        province: 'MI',
        country: 'IT',
        latitude: 45.4,
        longitude: 9.2,
        hours: null,
        isActive: true,
      },
      {
        id: 'loc-near-donor',
        kind: 'COLLECTION_POINT',
        address: 'Via Roma Nord',
        city: 'Roma',
        postalCode: '00100',
        province: 'RM',
        country: 'IT',
        latitude: 41.95,
        longitude: 12.6,
        hours: null,
        isActive: true,
      },
    ] as any);

    mockPrisma.object.updateMany.mockImplementation(async () => ({ count: 1 }));
    mockPrisma.request.create.mockImplementation(async (args: any) => ({
      id: 'req-1',
      objectId: args.data.objectId,
      recipientId: args.data.recipientId,
      intermediaryId: args.data.intermediaryId,
      message: args.data.message,
      status: args.data.status,
      object: {
        id: OBJECT_ID,
        title: 'Sedia',
        donorId: DONOR_ID,
        donor: { id: DONOR_ID, name: 'Donor', email: 'd@test.it' },
      },
    }));
    mockPrisma.donation.create.mockImplementation(async (args: any) => ({ id: 'don-1', ...args.data }));

    const response = await POST(buildRequest(OBJECT_ID), undefined as any);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.locationSuggestion.suggested).not.toBeNull();
    expect(body.locationSuggestion.suggested.id).toBe('loc:loc-near-donor');
    expect(body.locationSuggestion.allLocations).toHaveLength(3); // main + 2 locations

    // Verifica ordinamento per score ascendente
    const scores = body.locationSuggestion.allLocations.map((l: any) => l.totalScoreKm);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
    }

    // Email QR: blocco include sede suggerita + altre sedi
    const block = mockSendDeliveryQr.mock.calls[0][15] as string;
    expect(block).toContain('Sede consigliata');
    expect(block).toContain('Via Roma Nord');
    expect(block).toContain('Altre sedi disponibili');
  });

  it('donatore/beneficiario senza coordinate: fallback alla sede principale', async () => {
    await authAsAuthorizedRecipient();
    setupAvailableObject({ autoApprove: true });

    // Nessuna coordinata per donatore/beneficiario → suggestLocation ritorna main (tie-break)
    mockPrisma.user.findUnique.mockImplementation(async (args: any) => {
      if (args?.select?.authorized !== undefined) {
        return { authorized: true };
      }
      return { latitude: null, longitude: null };
    });

    mockPrisma.object.updateMany.mockImplementation(async () => ({ count: 1 }));
    mockPrisma.request.create.mockImplementation(async (args: any) => ({
      id: 'req-1',
      objectId: args.data.objectId,
      recipientId: args.data.recipientId,
      intermediaryId: args.data.intermediaryId,
      message: args.data.message,
      status: args.data.status,
      object: {
        id: OBJECT_ID,
        title: 'Sedia',
        donorId: DONOR_ID,
        donor: { id: DONOR_ID, name: 'Donor', email: 'd@test.it' },
      },
    }));
    mockPrisma.donation.create.mockImplementation(async (args: any) => ({ id: 'don-1', ...args.data }));

    const response = await POST(buildRequest(OBJECT_ID), undefined as any);
    expect(response.status).toBe(200);

    const body = await response.json();
    // Senza coordinate: tutti gli score sono Infinity, tie-break per id
    // → vince la main sede (id "main:...") vs "loc:loc-..." — la main viene
    // per prima lessicograficamente
    expect(body.locationSuggestion.suggested).not.toBeNull();
    expect(body.locationSuggestion.suggested.id).toBe(`main:${INTERMEDIARY_ID}`);
  });
});
