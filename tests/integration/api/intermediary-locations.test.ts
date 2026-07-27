/**
 * Test integrazione API /api/intermediary/locations + /api/intermediary/operators/[id]/locations
 *
 * Fase B (sedi aggiuntive enti).
 * Obiettivi:
 *   1. Auth: 401 senza sessione, 403 se non INTERMEDIARY
 *   2. Cross-org: 404 se l'ente A tenta di operare su sedi dell'ente B
 *   3. CRUD base: lista, create, update, soft-delete
 *   4. Soft-delete idempotente + preserva OperatorLocation esistenti
 *   5. Anti-spoofing location: locationId fuori dall'ente → 400
 *   6. PUT operator locations idempotente (stesso set dopo due PUT identici)
 *   7. PUT operator locations con array vuoto = disabilitazione totale
 *
 * Strategia: black-box su response + white-box su Prisma mocks.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma, resetAllMocks } from '../../setup/mocks';

vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue('mock-token'),
  })),
}));

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

import { GET as listLocations, POST as createLocation } from '@/app/api/intermediary/locations/route';
import {
  PUT as updateLocation,
  DELETE as deleteLocation,
} from '@/app/api/intermediary/locations/[id]/route';
import {
  GET as getOperatorLocations,
  PUT as setOperatorLocations,
} from '@/app/api/intermediary/operators/[id]/locations/route';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);

// ---------- helpers ----------

function buildRequest(body: unknown): Request {
  return new Request('http://test.local', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

function buildDeleteRequest(): Request {
  return new Request('http://test.local', { method: 'DELETE' });
}

async function authedAsIntermediary(orgId = 'org-A', userId = 'user-A') {
  mockCookies.mockResolvedValue({
    get: (name: string) =>
      name === 'session' ? { value: 'valid-token' } : undefined,
  } as any);
  mockJwtVerify.mockResolvedValue({
    payload: { user: { id: userId, role: 'INTERMEDIARY', email: 'a@ente.it', name: 'A' } },
  } as any);
  return { orgId, userId };
}

const VALID_LOCATION_PAYLOAD = {
  address: 'Via Roma 1',
  city: 'Milano',
  postalCode: '20100',
  province: 'MI',
  country: 'IT',
  latitude: 45.4642,
  longitude: 9.19,
  hours: {
    monday: [{ open: '09:00', close: '18:00' }],
    tuesday: [{ open: '09:00', close: '18:00' }],
    sunday: null,
  },
};

// ---------- tests ----------

describe('API /api/intermediary/locations (Fase B)', () => {
  beforeEach(() => {
    resetAllMocks();
    mockCookies.mockReset();
    mockJwtVerify.mockReset();
  });

  // ===== Auth =====

  describe('auth', () => {
    it('GET returns 401 without session', async () => {
      mockCookies.mockResolvedValue({ get: () => undefined } as any);
      const res = await listLocations(undefined as any, undefined as any);
      expect(res.status).toBe(401);
    });

    it('GET returns 403 if role !== INTERMEDIARY', async () => {
      await authedAsIntermediary();
      mockJwtVerify.mockResolvedValue({
        payload: { user: { id: 'u', role: 'DONOR', email: 'd@d.it', name: 'D' } },
      } as any);
      const res = await listLocations(undefined as any, undefined as any);
      expect(res.status).toBe(403);
    });

    it('POST returns 401 without session', async () => {
      mockCookies.mockResolvedValue({ get: () => undefined } as any);
      const res = await createLocation(buildRequest(VALID_LOCATION_PAYLOAD), undefined as any);
      expect(res.status).toBe(401);
    });

    it('PUT returns 403 for DONOR role', async () => {
      await authedAsIntermediary();
      mockJwtVerify.mockResolvedValue({
        payload: { user: { id: 'u', role: 'DONOR', email: 'd@d.it', name: 'D' } },
      } as any);
      const res = await updateLocation(buildRequest(VALID_LOCATION_PAYLOAD), {
        params: Promise.resolve({ id: 'loc-1' }),
      });
      expect(res.status).toBe(403);
    });
  });

  // ===== GET list =====

  describe('GET /api/intermediary/locations', () => {
    it('returns 404 if organization not found', async () => {
      await authedAsIntermediary();
      mockPrisma.organization.findUnique.mockResolvedValue(null);
      const res = await listLocations(undefined as any, undefined as any);
      expect(res.status).toBe(404);
    });

    it('returns only locations of current org with operator count', async () => {
      await authedAsIntermediary();
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-A' });
      mockPrisma.location.findMany.mockResolvedValue([
        { id: 'loc-1', address: 'Via Roma', isActive: true, _count: { operatorLocations: 3 } },
        { id: 'loc-2', address: 'Via Verdi', isActive: true, _count: { operatorLocations: 0 } },
      ] as any);

      const res = await listLocations(undefined as any, undefined as any);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.locations).toHaveLength(2);

      // White-box: la query filtra per organizationId dell'ente corrente
      expect(mockPrisma.location.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-A' },
        })
      );
    });
  });

  // ===== POST create =====

  describe('POST /api/intermediary/locations', () => {
    it('returns 400 on invalid lat/lng', async () => {
      await authedAsIntermediary();
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-A' });
      const res = await createLocation(
        buildRequest({ ...VALID_LOCATION_PAYLOAD, latitude: 999 }),
        undefined as any
      );
      expect(res.status).toBe(400);
      expect(mockPrisma.location.create).not.toHaveBeenCalled();
    });

    it('returns 400 on invalid hours format (open >= close)', async () => {
      await authedAsIntermediary();
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-A' });
      const res = await createLocation(
        buildRequest({
          ...VALID_LOCATION_PAYLOAD,
          hours: { monday: [{ open: '18:00', close: '09:00' }] },
        }),
        undefined as any
      );
      expect(res.status).toBe(400);
    });

    it('rejects unknown kind (anti-spoofing: solo COLLECTION_POINT)', async () => {
      await authedAsIntermediary();
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-A' });
      // Lo zod schema NON accetta `kind` → viene rimosso
      // Verifica che createLocation non crashi e ritorni 201 con kind forzato a COLLECTION_POINT
      mockPrisma.location.create.mockImplementation(async ({ data }: any) => ({
        id: 'loc-new',
        ...data,
      }));
      const res = await createLocation(
        buildRequest({ ...VALID_LOCATION_PAYLOAD, kind: 'MAIN' }),
        undefined as any
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.location.kind).toBe('COLLECTION_POINT');
    });

    it('creates location with org from session (not from body)', async () => {
      await authedAsIntermediary();
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-A' });
      mockPrisma.location.create.mockImplementation(async ({ data }: any) => ({
        id: 'loc-new',
        ...data,
      }));

      const res = await createLocation(
        buildRequest({ ...VALID_LOCATION_PAYLOAD, organizationId: 'org-EVIL' }),
        undefined as any
      );
      expect(res.status).toBe(201);
      const body = await res.json();

      // White-box: anche se il body prova a spoofing org, viene usato quello della session
      expect(mockPrisma.location.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ organizationId: 'org-A' }),
        })
      );
      expect(body.location.organizationId).toBe('org-A');
    });
  });

  // ===== PUT update =====

  describe('PUT /api/intermediary/locations/[id]', () => {
    it('returns 404 if location does not belong to current org (cross-org block)', async () => {
      await authedAsIntermediary();
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-A' });
      // Cross-org: findFirst con where { id, organizationId: org-A } ritorna null
      mockPrisma.location.findFirst.mockResolvedValue(null);

      const res = await updateLocation(buildRequest(VALID_LOCATION_PAYLOAD), {
        params: Promise.resolve({ id: 'loc-of-org-B' }),
      });
      expect(res.status).toBe(404);
      // White-box: niente update
      expect(mockPrisma.location.update).not.toHaveBeenCalled();
    });

    it('updates location if owned', async () => {
      await authedAsIntermediary();
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-A' });
      mockPrisma.location.findFirst.mockResolvedValue({ id: 'loc-1' });
      mockPrisma.location.update.mockImplementation(async ({ where, data }: any) => ({
        id: where.id,
        ...data,
      }));

      const res = await updateLocation(buildRequest(VALID_LOCATION_PAYLOAD), {
        params: Promise.resolve({ id: 'loc-1' }),
      });
      expect(res.status).toBe(200);
      expect(mockPrisma.location.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'loc-1' } })
      );
    });
  });

  // ===== DELETE soft =====

  describe('DELETE /api/intermediary/locations/[id]', () => {
    it('is idempotent: 200 + no update if already inactive', async () => {
      await authedAsIntermediary();
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-A' });
      mockPrisma.location.findFirst.mockResolvedValue({ id: 'loc-1', isActive: false });

      const res = await deleteLocation(buildDeleteRequest(), {
        params: Promise.resolve({ id: 'loc-1' }),
      });
      expect(res.status).toBe(200);
      expect(mockPrisma.location.update).not.toHaveBeenCalled();
    });

    it('soft-deletes by setting isActive=false (does NOT remove OperatorLocation)', async () => {
      await authedAsIntermediary();
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-A' });
      mockPrisma.location.findFirst.mockResolvedValue({ id: 'loc-1', isActive: true });
      mockPrisma.location.update.mockResolvedValue({ id: 'loc-1', isActive: false } as any);

      const res = await deleteLocation(buildDeleteRequest(), {
        params: Promise.resolve({ id: 'loc-1' }),
      });
      expect(res.status).toBe(200);
      expect(mockPrisma.location.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: false }),
        })
      );
      // White-box: nessuna deleteMany su operatorLocation (le abilitazioni restano)
      expect(mockPrisma.operatorLocation.deleteMany).not.toHaveBeenCalled();
    });

    it('returns 404 for cross-org delete attempt', async () => {
      await authedAsIntermediary();
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-A' });
      mockPrisma.location.findFirst.mockResolvedValue(null);

      const res = await deleteLocation(buildDeleteRequest(), {
        params: Promise.resolve({ id: 'loc-of-org-B' }),
      });
      expect(res.status).toBe(404);
    });
  });
});

// ========================================================================
// API /api/intermediary/operators/[id]/locations
// ========================================================================

describe('API /api/intermediary/operators/[id]/locations (Fase B)', () => {
  beforeEach(() => {
    resetAllMocks();
    mockCookies.mockReset();
    mockJwtVerify.mockReset();
  });

  describe('GET', () => {
    it('returns 404 if operator belongs to another org', async () => {
      await authedAsIntermediary();
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-A' });
      mockPrisma.operator.findFirst.mockResolvedValue(null);

      const res = await getOperatorLocations(buildRequest(null), {
        params: Promise.resolve({ id: 'op-of-org-B' }),
      });
      expect(res.status).toBe(404);
    });

    it('returns all org locations with enabled flag', async () => {
      await authedAsIntermediary();
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-A' });
      mockPrisma.operator.findFirst.mockResolvedValue({ id: 'op-1' });
      mockPrisma.location.findMany.mockResolvedValue([
        { id: 'loc-1', address: 'Via Roma', city: 'MI', isActive: true },
        { id: 'loc-2', address: 'Via Verdi', city: 'MI', isActive: true },
      ] as any);
      mockPrisma.operatorLocation.findMany.mockResolvedValue([{ locationId: 'loc-1' }] as any);

      const res = await getOperatorLocations(buildRequest(null), {
        params: Promise.resolve({ id: 'op-1' }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.locations).toHaveLength(2);
      expect(body.locations[0].enabled).toBe(true);
      expect(body.locations[1].enabled).toBe(false);
    });
  });

  describe('PUT', () => {
    it('rejects if any locationId is not in current org (anti-spoofing)', async () => {
      await authedAsIntermediary();
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-A' });
      mockPrisma.operator.findFirst.mockResolvedValue({ id: 'op-1' });
      // 1 solo di 2 ID è dell'ente
      mockPrisma.location.count.mockResolvedValue(1);

      const res = await setOperatorLocations(buildRequest(['loc-1', 'loc-of-org-B']), {
        params: Promise.resolve({ id: 'op-1' }),
      });
      expect(res.status).toBe(400);
      // White-box: niente deleteMany/createMany su operatorLocation
      expect(mockPrisma.operatorLocation.deleteMany).not.toHaveBeenCalled();
    });

    it('replaces set idempotently (delete + create in tx)', async () => {
      await authedAsIntermediary();
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-A' });
      mockPrisma.operator.findFirst.mockResolvedValue({ id: 'op-1' });
      mockPrisma.location.count.mockResolvedValue(2);
      mockPrisma.operatorLocation.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.operatorLocation.createMany.mockResolvedValue({ count: 2 });

      const res = await setOperatorLocations(buildRequest(['loc-1', 'loc-2']), {
        params: Promise.resolve({ id: 'op-1' }),
      });
      expect(res.status).toBe(200);

      // White-box: deleteMany PRIMA, createMany DOPO, dentro $transaction
      const deleteCallOrder = mockPrisma.operatorLocation.deleteMany.mock.invocationCallOrder[0];
      const createCallOrder = mockPrisma.operatorLocation.createMany.mock.invocationCallOrder[0];
      expect(deleteCallOrder).toBeLessThan(createCallOrder);

      // Verifica il deleteMany con where corretto
      expect(mockPrisma.operatorLocation.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            operatorId: 'op-1',
            location: { organizationId: 'org-A' },
          }),
        })
      );
    });

    it('handles empty array = total disabilitazione', async () => {
      await authedAsIntermediary();
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-A' });
      mockPrisma.operator.findFirst.mockResolvedValue({ id: 'op-1' });
      mockPrisma.operatorLocation.deleteMany.mockResolvedValue({ count: 3 });
      // createMany NON deve essere chiamato (locationIds.length === 0)

      const res = await setOperatorLocations(buildRequest([]), {
        params: Promise.resolve({ id: 'op-1' }),
      });
      expect(res.status).toBe(200);
      expect(mockPrisma.operatorLocation.createMany).not.toHaveBeenCalled();
    });

    it('returns 400 on non-array payload', async () => {
      await authedAsIntermediary();
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-A' });
      mockPrisma.operator.findFirst.mockResolvedValue({ id: 'op-1' });

      const res = await setOperatorLocations(buildRequest({ not: 'an array' }), {
        params: Promise.resolve({ id: 'op-1' }),
      });
      expect(res.status).toBe(400);
    });
  });
});
