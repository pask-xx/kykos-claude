import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
}));

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { GET as GETGoodsOffers } from '@/app/api/donor/goods-offers/route';
import { GET as GETObjectDetail } from '@/app/api/donor/objects/[id]/route';
import { mockPrisma, resetAllMocks } from '../../setup/mocks';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);

async function authedAs(role: 'DONOR' | 'RECIPIENT' | 'ADMIN' | 'INTERMEDIARY') {
  const payload = {
    id: 'user-1',
    email: 'u@test.it',
    name: 'Test User',
    role,
  };
  mockCookies.mockResolvedValue({ get: () => ({ value: 'valid-token' }) } as any);
  mockJwtVerify.mockResolvedValue({ payload: { user: payload } } as any);
  return payload;
}

describe('GET /api/donor/goods-offers — anonymity + authorization (Fase 34.1)', () => {
  beforeEach(() => {
    resetAllMocks();
    mockCookies.mockReset();
    mockJwtVerify.mockReset();
    mockPrisma.goodsOffer.findMany.mockReset();
  });

  it('returns 401 when no session is present', async () => {
    mockCookies.mockResolvedValue({ get: () => undefined } as any);
    const response = await GETGoodsOffers();
    expect(response.status).toBe(401);
  });

  it('returns 403 when the caller is a RECIPIENT (authorization gap fix)', async () => {
    // PRIMA della Fase 34.1 un RECIPIENT autenticato poteva leggere
    // le goods-offers altrui perché la route controllava solo la
    // sessione, non il ruolo.
    await authedAs('RECIPIENT');
    const response = await GETGoodsOffers();
    expect(response.status).toBe(403);
  });

  it('returns 403 when the caller is an INTERMEDIARY', async () => {
    await authedAs('INTERMEDIARY');
    const response = await GETGoodsOffers();
    expect(response.status).toBe(403);
  });

  it('returns 200 when the caller is a DONOR', async () => {
    await authedAs('DONOR');
    mockPrisma.goodsOffer.findMany.mockResolvedValue([]);
    const response = await GETGoodsOffers();
    expect(response.status).toBe(200);
  });

  it('does NOT include any beneficiary personal data in the response (Regola #1 KYKOS)', async () => {
    await authedAs('DONOR');
    // Simuliamo una offer la cui request ha un beneficiary con PII completa
    // nel DB. La route NON deve esporre nulla di tutto ciò.
    // Poiché la route ora usa `select: { id, title, ... }` su `request`,
    // Prisma ritornerebbe SOLO i campi selezionati (nessun `beneficiary`).
    // Simuliamo il comportamento realistico: il campo `beneficiary` non c'è
    // proprio nel result set. Questo test verifica la GARANZIA del `select`
    // nella query.
    const offerFromDb = {
      id: 'offer-1',
      requestId: 'req-1',
      message: 'Posso donare',
      status: 'ACCEPTED',
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
      offeredById: 'user-1',
      imageUrls: [],
      request: {
        id: 'req-1',
        title: 'Letto singolo',
        category: 'FURNITURE',
        status: 'APPROVED',
        type: 'GOODS',
        // NB: Prisma con `select: { id, title, ... }` NON ritorna
        // `beneficiary` nel result set. La PII del ricevente resta
        // nel DB ma non viene MAI esposta al DONOR.
      },
    };
    mockPrisma.goodsOffer.findMany.mockResolvedValue([offerFromDb] as any);

    const response = await GETGoodsOffers();
    expect(response.status).toBe(200);

    const body = await response.json();
    const offer = body.offers[0];

    // CRITICAL: il campo `request.beneficiary` NON deve esistere affatto
    // nel response. Se esistesse, il DONOR potrebbe re-identificare il
    // beneficiario.
    expect(offer.request.beneficiary).toBeUndefined();

    // Belt and braces: anche se un futuro refactor reintroducesse
    // l'include, questi campi non devono MAI apparire.
    const serialized = JSON.stringify(offer);
    expect(serialized).not.toContain('Mario Rossi');
    expect(serialized).not.toContain('mario@example.com');
    expect(serialized).not.toContain('RSSMRA80A01H501U');
    expect(serialized).not.toMatch(/ben-1/); // beneficiary id
    expect(serialized).not.toContain('"name"');
    expect(serialized).not.toContain('"email"');
    expect(serialized).not.toContain('"fiscalCode"');
    expect(serialized).not.toContain('"firstName"');
    expect(serialized).not.toContain('"lastName"');
  });

  it('DOES include the safe request fields needed by the UI', async () => {
    await authedAs('DONOR');
    mockPrisma.goodsOffer.findMany.mockResolvedValue([
      {
        id: 'offer-1',
        requestId: 'req-1',
        message: null,
        status: 'PENDING',
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
        offeredById: 'user-1',
        imageUrls: [],
        request: {
          id: 'req-1',
          title: 'Letto singolo',
          category: 'FURNITURE',
          status: 'APPROVED',
          type: 'GOODS',
        },
      },
    ] as any);

    const response = await GETGoodsOffers();
    const body = await response.json();
    const offer = body.offers[0];

    // La UI ha bisogno di questi campi per rendere la card.
    expect(offer.request.id).toBe('req-1');
    expect(offer.request.title).toBe('Letto singolo');
    expect(offer.request.category).toBe('FURNITURE');
    expect(offer.request.status).toBe('APPROVED');
    expect(offer.request.type).toBe('GOODS');
  });

  it('uses a Prisma `select` that NEVER includes `beneficiary` (query-level anonymity)', async () => {
    // White-box: verifichiamo che la QUERY Prisma costruita dalla route
    // abbia un `select` esplicito sui campi della request, SENZA
    // includere `beneficiary`. Questo impedisce che un futuro refactor
    // reintroduca la fuga di PII per sbaglio.
    await authedAs('DONOR');
    mockPrisma.goodsOffer.findMany.mockResolvedValue([] as any);

    await GETGoodsOffers();

    expect(mockPrisma.goodsOffer.findMany).toHaveBeenCalledTimes(1);
    const callArgs = mockPrisma.goodsOffer.findMany.mock.calls[0][0];

    // La request deve essere caricata con `select` (NON `include`).
    expect(callArgs.include.request.select).toBeDefined();
    expect(callArgs.include.request.include).toBeUndefined();

    // Il select NON deve contenere campi che espongono PII.
    const selectKeys = Object.keys(callArgs.include.request.select);
    expect(selectKeys).not.toContain('beneficiary');
    expect(selectKeys).not.toContain('recipient');
    expect(selectKeys).not.toContain('donor');
  });
});

describe('GET /api/donor/objects/[id] — anonymity (Fase 34.1)', () => {
  beforeEach(() => {
    resetAllMocks();
    mockCookies.mockReset();
    mockJwtVerify.mockReset();
    mockPrisma.object.findFirst.mockReset();
  });

  it('returns 401 when no session is present', async () => {
    mockCookies.mockResolvedValue({ get: () => undefined } as any);
    const response = await GETObjectDetail(new Request('http://test.local/api/donor/objects/obj-1'), {
      params: Promise.resolve({ id: 'obj-1' }),
    });
    expect(response.status).toBe(401);
  });

  it('returns 403 when the caller is not a DONOR', async () => {
    await authedAs('RECIPIENT');
    const response = await GETObjectDetail(new Request('http://test.local/api/donor/objects/obj-1'), {
      params: Promise.resolve({ id: 'obj-1' }),
    });
    expect(response.status).toBe(403);
  });

  it('does NOT include any recipient personal data in the requests array (Regola #1 KYKOS)', async () => {
    await authedAs('DONOR');
    // Simuliamo un oggetto con requests. Poiché la route ora usa
    // `select: { id, status, createdAt }` su `requests`, Prisma NON
    // ritorna `recipient` nel result set. La PII del ricevente resta
    // nel DB ma non viene MAI esposta al DONOR.
    const objectFromDb = {
      id: 'obj-1',
      title: 'Sedia a rotelle',
      description: 'In buone condizioni',
      category: 'OTHER',
      condition: 'GOOD',
      status: 'DEPOSITED',
      imageUrls: [],
      depositLocation: 'Caritas Roma',
      createdAt: new Date('2026-01-01'),
      donorId: 'user-1',
      requests: [
        {
          id: 'req-1',
          status: 'APPROVED',
          createdAt: new Date('2026-01-10'),
        },
      ],
    };
    mockPrisma.object.findFirst.mockResolvedValue(objectFromDb as any);

    const response = await GETObjectDetail(new Request('http://test.local/api/donor/objects/obj-1'), {
      params: Promise.resolve({ id: 'obj-1' }),
    });
    expect(response.status).toBe(200);

    const body = await response.json();
    const request = body.object.requests[0];

    // CRITICAL: il campo `recipient` NON deve esistere affatto.
    expect(request.recipient).toBeUndefined();

    // Belt and braces
    const serialized = JSON.stringify(request);
    expect(serialized).not.toContain('"recipient"');
  });

  it('DOES include the safe request fields needed by the UI', async () => {
    await authedAs('DONOR');
    mockPrisma.object.findFirst.mockResolvedValue({
      id: 'obj-1',
      title: 'Sedia a rotelle',
      description: 'In buone condizioni',
      category: 'OTHER',
      condition: 'GOOD',
      status: 'DEPOSITED',
      imageUrls: [],
      depositLocation: 'Caritas Roma',
      createdAt: new Date('2026-01-01'),
      donorId: 'user-1',
      requests: [
        { id: 'req-1', status: 'APPROVED', createdAt: new Date('2026-01-10') },
      ],
    } as any);

    const response = await GETObjectDetail(new Request('http://test.local/api/donor/objects/obj-1'), {
      params: Promise.resolve({ id: 'obj-1' }),
    });
    const body = await response.json();
    const request = body.object.requests[0];

    expect(request.id).toBe('req-1');
    expect(request.status).toBe('APPROVED');
    expect(request.createdAt).toBeDefined();
  });

  it('uses a Prisma `select` on requests that NEVER includes `recipient` (query-level anonymity)', async () => {
    // White-box: verifichiamo che la QUERY Prisma costruita dalla route
    // usi un `select` esplicito sui campi delle requests, SENZA
    // includere `recipient`.
    await authedAs('DONOR');
    mockPrisma.object.findFirst.mockResolvedValue({
      id: 'obj-1',
      donorId: 'user-1',
      requests: [],
    } as any);

    await GETObjectDetail(new Request('http://test.local/api/donor/objects/obj-1'), {
      params: Promise.resolve({ id: 'obj-1' }),
    });

    expect(mockPrisma.object.findFirst).toHaveBeenCalledTimes(1);
    const callArgs = mockPrisma.object.findFirst.mock.calls[0][0];

    // Le requests devono essere caricate con `select` (NON `include`).
    expect(callArgs.include.requests.select).toBeDefined();
    expect(callArgs.include.requests.include).toBeUndefined();

    // Il select NON deve contenere campi che espongono PII.
    const selectKeys = Object.keys(callArgs.include.requests.select);
    expect(selectKeys).not.toContain('recipient');
    expect(selectKeys).not.toContain('beneficiary');
    expect(selectKeys).not.toContain('donor');
  });
});
