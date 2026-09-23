import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
}));

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { GET as GETObjects } from '@/app/api/objects/route';
import { mockPrisma, resetAllMocks } from '../../setup/mocks';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);

async function authedAs(
  role: 'DONOR' | 'RECIPIENT' | 'ADMIN' | 'INTERMEDIARY' | 'OPERATOR',
  userId = 'recipient-1'
) {
  const payload = {
    id: userId,
    email: 'u@test.it',
    name: 'Test User',
    role,
  };
  mockCookies.mockResolvedValue({ get: () => ({ value: 'valid-token' }) } as any);
  mockJwtVerify.mockResolvedValue({ payload: { user: payload } } as any);
  return payload;
}

function makeRequest(url = 'http://test/api/objects') {
  return new Request(url);
}

describe('GET /api/objects — filtri recipient (cross-entity + già richiesti + propri)', () => {
  beforeEach(() => {
    resetAllMocks();
    mockCookies.mockReset();
    mockJwtVerify.mockReset();
  });

  describe('Auth & ruoli', () => {
    it('ritorna 401 senza sessione', async () => {
      mockCookies.mockResolvedValue({ get: () => undefined } as any);
      const response = await GETObjects(makeRequest(), undefined as any);
      expect(response.status).toBe(401);
    });

    it('per DONOR non attiva il branch recipient (nessun lookup su User per scope)', async () => {
      await authedAs('DONOR', 'donor-1');
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.object.findMany.mockResolvedValue([]);

      const response = await GETObjects(makeRequest(), undefined as any);

      expect(response.status).toBe(200);
      // DONOR non passa per buildObjectWhereForRecipient → mockPrisma.user.findUnique
      // per scope NON deve essere chiamato
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('per ADMIN non attiva il branch recipient', async () => {
      await authedAs('ADMIN', 'admin-1');
      mockPrisma.object.findMany.mockResolvedValue([]);

      const response = await GETObjects(makeRequest(), undefined as any);

      expect(response.status).toBe(200);
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('per INTERMEDIARY non attiva il branch recipient', async () => {
      await authedAs('INTERMEDIARY', 'intermediary-1');
      mockPrisma.object.findMany.mockResolvedValue([]);

      const response = await GETObjects(makeRequest(), undefined as any);

      expect(response.status).toBe(200);
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('Recipient senza scope (no-entity / unauthorized)', () => {
    it('recipient senza referenceEntityId → 200 con { objects: [] } e nessuna query Request', async () => {
      await authedAs('RECIPIENT', 'recipient-1');
      mockPrisma.user.findUnique.mockResolvedValue({
        referenceEntityId: null,
        authorized: true,
      });

      const response = await GETObjects(makeRequest(), undefined as any);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ objects: [] });
      // Short-circuit: niente query su Request quando scope è no-entity
      expect(mockPrisma.request.findMany).not.toHaveBeenCalled();
      // Niente query su Object quando scope è no-entity
      expect(mockPrisma.object.findMany).not.toHaveBeenCalled();
    });

    it('recipient con authorized === false → 200 con { objects: [] } e nessuna query Request', async () => {
      await authedAs('RECIPIENT', 'recipient-1');
      mockPrisma.user.findUnique.mockResolvedValue({
        referenceEntityId: 'org-X',
        authorized: false,
      });

      const response = await GETObjects(makeRequest(), undefined as any);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ objects: [] });
      expect(mockPrisma.request.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.object.findMany).not.toHaveBeenCalled();
    });
  });

  describe('Recipient autorizzato (scope ok)', () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({
        referenceEntityId: 'org-X',
        authorized: true,
      });
    });

    it('applica where con status=AVAILABLE + intermediaryId del recipient + esclusione propri, no richieste pregresse', async () => {
      await authedAs('RECIPIENT', 'recipient-1');
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.object.findMany.mockResolvedValue([]);

      const response = await GETObjects(makeRequest(), undefined as any);

      expect(response.status).toBe(200);

      // White-box sul where passato a prisma.object.findMany
      const findManyCall = mockPrisma.object.findMany.mock.calls[0][0];
      expect(findManyCall.where).toEqual({
        status: 'AVAILABLE',
        intermediaryId: 'org-X',
        NOT: {
          OR: [
            { id: { in: [] } },
            { donorId: 'recipient-1' },
          ],
        },
      });
    });

    it('esclude gli oggetti per cui il recipient ha già fatto richiesta', async () => {
      await authedAs('RECIPIENT', 'recipient-1');
      mockPrisma.request.findMany.mockResolvedValue([
        { objectId: 'obj-A' },
        { objectId: 'obj-B' },
      ]);
      mockPrisma.object.findMany.mockResolvedValue([]);

      const response = await GETObjects(makeRequest(), undefined as any);

      expect(response.status).toBe(200);
      const findManyCall = mockPrisma.object.findMany.mock.calls[0][0];
      expect(findManyCall.where.NOT).toEqual({
        OR: [
          { id: { in: ['obj-A', 'obj-B'] } },
          { donorId: 'recipient-1' },
        ],
      });
    });

    it('NON espone PII del donatore (Regola #1 KYKOS anonimato)', async () => {
      await authedAs('RECIPIENT', 'recipient-1');
      mockPrisma.request.findMany.mockResolvedValue([]);
      // Anche se il DB ritornasse PII completa nel `donor`, la select esistente
      // NON le include (seleziona solo latitude, longitude, donorProfile.level).
      // Verifichiamo che l'oggetto `donor` esposto al non includa i campi vietati.
      mockPrisma.object.findMany.mockResolvedValue([
        {
          id: 'obj-1',
          title: 'Sedia',
          description: null,
          category: 'FURNITURE',
          condition: 'GOOD',
          imageUrls: [],
          status: 'AVAILABLE',
          createdAt: new Date(),
          donor: {
            latitude: null,
            longitude: null,
            donorProfile: { level: 'BRONZE' },
          },
          intermediary: {
            id: 'org-X',
            name: 'Caritas',
            latitude: 41.9,
            longitude: 12.5,
          },
        },
      ] as any);

      const response = await GETObjects(makeRequest(), undefined as any);
      const body = await response.json();

      // Controlla solo l'oggetto `donor` (intermediary.name è legittimo)
      const donorJson = JSON.stringify(body.objects[0].donor);
      expect(donorJson).not.toMatch(/"name"/i);
      expect(donorJson).not.toMatch(/"email"/i);
      expect(donorJson).not.toMatch(/"firstName"/i);
      expect(donorJson).not.toMatch(/"lastName"/i);
      expect(donorJson).not.toMatch(/"fiscalCode"/i);
      // La select esistente include solo i campi consentiti
      expect(body.objects[0].donor).toHaveProperty('latitude');
      expect(body.objects[0].donor).toHaveProperty('longitude');
      expect(body.objects[0].donor).toHaveProperty('donorProfile');
      expect(body.objects[0].donor.donorProfile).toEqual({ level: 'BRONZE' });
    });

    it('applica il filtro categoria passato in query string combinato con filtri recipient', async () => {
      await authedAs('RECIPIENT', 'recipient-1');
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.object.findMany.mockResolvedValue([]);

      const response = await GETObjects(
        makeRequest('http://test/api/objects?category=FURNITURE'),
        undefined as any
      );

      expect(response.status).toBe(200);
      const findManyCall = mockPrisma.object.findMany.mock.calls[0][0];
      expect(findManyCall.where).toMatchObject({
        status: 'AVAILABLE',
        intermediaryId: 'org-X',
        category: 'FURNITURE',
      });
    });

    it('NON applica il filtro categoria quando category=ALL', async () => {
      await authedAs('RECIPIENT', 'recipient-1');
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.object.findMany.mockResolvedValue([]);

      const response = await GETObjects(
        makeRequest('http://test/api/objects?category=ALL'),
        undefined as any
      );

      expect(response.status).toBe(200);
      const findManyCall = mockPrisma.object.findMany.mock.calls[0][0];
      expect(findManyCall.where).not.toHaveProperty('category');
    });

    it('NON applica il filtro categoria quando assente in query string', async () => {
      await authedAs('RECIPIENT', 'recipient-1');
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.object.findMany.mockResolvedValue([]);

      const response = await GETObjects(makeRequest(), undefined as any);

      expect(response.status).toBe(200);
      const findManyCall = mockPrisma.object.findMany.mock.calls[0][0];
      expect(findManyCall.where).not.toHaveProperty('category');
    });
  });

  describe('Response shape invariata (compatibilità all\'indietro)', () => {
    it('la response mantiene { objects: T[] } con campi donor/intermediary/distance', async () => {
      await authedAs('RECIPIENT', 'recipient-1');
      mockPrisma.user.findUnique.mockResolvedValue({
        referenceEntityId: 'org-X',
        authorized: true,
      });
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.object.findMany.mockResolvedValue([
        {
          id: 'obj-1',
          title: 'Sedia',
          description: null,
          category: 'FURNITURE',
          condition: 'GOOD',
          imageUrls: [],
          status: 'AVAILABLE',
          createdAt: new Date(),
          donor: {
            latitude: 41.9,
            longitude: 12.5,
            donorProfile: { level: 'BRONZE' },
          },
          intermediary: {
            id: 'org-X',
            name: 'Caritas',
            latitude: 41.9,
            longitude: 12.5,
          },
        },
      ] as any);

      const response = await GETObjects(
        makeRequest('http://test/api/objects?latitude=41.9&longitude=12.5&radius=10'),
        undefined as any
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.objects).toHaveLength(1);
      expect(body.objects[0]).toHaveProperty('id');
      expect(body.objects[0]).toHaveProperty('donor');
      expect(body.objects[0].donor).toHaveProperty('donorProfile');
      expect(body.objects[0].donor.donorProfile).toHaveProperty('level');
      expect(body.objects[0]).toHaveProperty('intermediary');
      expect(body.objects[0]).toHaveProperty('distance');
      // distance è 0 (stesso punto)
      expect(body.objects[0].distance).toBe(0);
    });
  });
});