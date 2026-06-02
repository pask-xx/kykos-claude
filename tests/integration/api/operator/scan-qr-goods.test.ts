import { describe, it, expect, vi, beforeEach } from 'vitest';
import { goodsRequestFixtures, operatorFixtures } from '../../../setup/fixtures/goods-requests';
import { mockPrisma, resetAllMocks } from '../../../setup/mocks';

// Mock jose for session helpers
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
import { POST } from '@/app/api/operator/scan-qr-goods/route';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);

function buildRequest(body: unknown): Request {
  return new Request('http://test.local/api/operator/scan-qr-goods', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

async function authedAsOperator(orgId = 'org-1', opId = 'op-1') {
  mockCookies.mockResolvedValue({
    get: (name: string) =>
      name === 'operator_session' ? { value: 'valid-token' } : undefined,
  } as any);
  mockJwtVerify.mockResolvedValue({
    payload: { operatorId: opId, organizationId: orgId, role: 'OPERATORE' },
  } as any);
}

describe('POST /api/operator/scan-qr-goods - QR Scan State Machine', () => {
  beforeEach(() => {
    resetAllMocks();
    mockCookies.mockReset();
    mockJwtVerify.mockReset();
  });

  describe('authentication', () => {
    it('returns 401 when no operator session cookie', async () => {
      mockCookies.mockResolvedValue({ get: () => undefined } as any);
      const response = await POST(buildRequest({ qrData: 'kykos:goods:deliver:req-1:user-1' }));
      expect(response.status).toBe(401);
    });

    it('returns 404 when operator does not exist or is inactive', async () => {
      await authedAsOperator();
      mockPrisma.operator.findUnique.mockResolvedValue(null);
      const response = await POST(buildRequest({ qrData: 'kykos:goods:deliver:req-1:user-1' }));
      expect(response.status).toBe(404);
    });

    it('returns 403 when operator lacks OBJECT_DELIVER permission', async () => {
      await authedAsOperator();
      mockPrisma.operator.findUnique.mockResolvedValue(operatorFixtures.withoutPermission as any);
      const response = await POST(buildRequest({ qrData: 'kykos:goods:deliver:req-1:user-1' }));
      expect(response.status).toBe(403);
    });
  });

  describe('invalid QR data', () => {
    beforeEach(async () => {
      await authedAsOperator();
      mockPrisma.operator.findUnique.mockResolvedValue(operatorFixtures.withPermission as any);
    });

    it('rejects non-string qrData with 400', async () => {
      const response = await POST(buildRequest({ qrData: 12345 }));
      expect(response.status).toBe(400);
    });

    it('rejects QR with invalid format (not kykos:...) with 400', async () => {
      const response = await POST(buildRequest({ qrData: 'random-string' }));
      expect(response.status).toBe(400);
    });

    it('rejects QR with wrong type (pickup instead of deliver) with 400', async () => {
      const response = await POST(buildRequest({
        qrData: 'kykos:goods:pickup:req-1:user-1',
      }));
      expect(response.status).toBe(400);
    });

    it('rejects QR with wrong subType (object instead of goods) with 400', async () => {
      const response = await POST(buildRequest({
        qrData: 'kykos:object:deliver:obj-req-1:user-1',
      }));
      expect(response.status).toBe(400);
    });
  });

  describe('state machine validation (Regola #2: stato valido)', () => {
    beforeEach(async () => {
      await authedAsOperator();
      mockPrisma.operator.findUnique.mockResolvedValue(operatorFixtures.withPermission as any);
    });

    it('rejects PENDING request (must be FULFILLED before delivery) with 400', async () => {
      mockPrisma.goodsRequest.findUnique.mockResolvedValue({
        ...goodsRequestFixtures.pending,
        beneficiary: { id: 'user-ben-1', name: 'Mario', email: 'mario@test.it' },
        fulfilledBy: null,
        intermediaryId: 'org-1',
        intermediary: { id: 'org-1', name: 'Caritas' },
      } as any);
      const response = await POST(buildRequest({
        qrData: 'kykos:goods:deliver:req-pending-1:user-donor-1',
      }));
      expect(response.status).toBe(400);
    });

    it('rejects APPROVED request (must be FULFILLED before delivery) with 400', async () => {
      mockPrisma.goodsRequest.findUnique.mockResolvedValue({
        ...goodsRequestFixtures.approved,
        beneficiary: { id: 'user-ben-1', name: 'Mario', email: 'mario@test.it' },
        fulfilledBy: null,
        intermediaryId: 'org-1',
        intermediary: { id: 'org-1', name: 'Caritas' },
      } as any);
      const response = await POST(buildRequest({
        qrData: 'kykos:goods:deliver:req-approved-1:user-donor-1',
      }));
      expect(response.status).toBe(400);
    });

    it('rejects CANCELLED request with 400', async () => {
      mockPrisma.goodsRequest.findUnique.mockResolvedValue({
        ...goodsRequestFixtures.cancelled,
        beneficiary: { id: 'user-ben-1', name: 'Mario', email: 'mario@test.it' },
        fulfilledBy: null,
        intermediaryId: 'org-1',
        intermediary: { id: 'org-1', name: 'Caritas' },
      } as any);
      const response = await POST(buildRequest({
        qrData: 'kykos:goods:deliver:req-cancelled-1:user-donor-1',
      }));
      expect(response.status).toBe(400);
    });

    it('rejects COMPLETED request with 400', async () => {
      mockPrisma.goodsRequest.findUnique.mockResolvedValue({
        ...goodsRequestFixtures.completed,
        beneficiary: { id: 'user-ben-1', name: 'Mario', email: 'mario@test.it' },
        fulfilledBy: { id: 'user-donor-1', name: 'Luca', email: 'luca@test.it' },
        intermediaryId: 'org-1',
        intermediary: { id: 'org-1', name: 'Caritas' },
      } as any);
      const response = await POST(buildRequest({
        qrData: 'kykos:goods:deliver:req-completed-1:user-donor-1',
      }));
      expect(response.status).toBe(400);
    });

    it('rejects already-DELIVERED request (duplicate scan protection) with 400', async () => {
      mockPrisma.goodsRequest.findUnique.mockResolvedValue({
        ...goodsRequestFixtures.delivered,
        beneficiary: { id: 'user-ben-1', name: 'Mario', email: 'mario@test.it' },
        fulfilledBy: { id: 'user-donor-1', name: 'Luca', email: 'luca@test.it' },
        intermediaryId: 'org-1',
        intermediary: { id: 'org-1', name: 'Caritas' },
      } as any);
      const response = await POST(buildRequest({
        qrData: 'kykos:goods:deliver:req-delivered-1:user-donor-1',
      }));
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/già utilizzato/i);
    });
  });

  describe('authorization', () => {
    beforeEach(async () => {
      await authedAsOperator();
      mockPrisma.operator.findUnique.mockResolvedValue(operatorFixtures.withPermission as any);
    });

    it('rejects QR for wrong donor (userId mismatch) with 400', async () => {
      mockPrisma.goodsRequest.findUnique.mockResolvedValue({
        ...goodsRequestFixtures.fulfilled,
        beneficiary: { id: 'user-ben-1', name: 'Mario', email: 'mario@test.it' },
        fulfilledBy: { id: 'user-donor-1', name: 'Luca', email: 'luca@test.it' },
        intermediaryId: 'org-1',
        intermediary: { id: 'org-1', name: 'Caritas' },
      } as any);
      // The QR claims donor-2, but the request was fulfilled by donor-1
      const response = await POST(buildRequest({
        qrData: 'kykos:goods:deliver:req-fulfilled-1:user-donor-2',
      }));
      expect(response.status).toBe(400);
    });

    it('rejects scan by operator from different organization with 403', async () => {
      // Re-auth as wrong-org operator
      mockCookies.mockReset();
      mockJwtVerify.mockReset();
      mockCookies.mockResolvedValue({
        get: (name: string) =>
          name === 'operator_session' ? { value: 'valid-token' } : undefined,
      } as any);
      mockJwtVerify.mockResolvedValue({
        payload: { operatorId: 'op-3', organizationId: 'org-other', role: 'OPERATORE' },
      } as any);
      mockPrisma.operator.findUnique.mockResolvedValue(operatorFixtures.wrongOrg as any);

      mockPrisma.goodsRequest.findUnique.mockResolvedValue({
        ...goodsRequestFixtures.fulfilled,
        beneficiary: { id: 'user-ben-1', name: 'Mario', email: 'mario@test.it' },
        fulfilledBy: { id: 'user-donor-1', name: 'Luca', email: 'luca@test.it' },
        intermediaryId: 'org-1', // request belongs to org-1, operator is in org-other
        intermediary: { id: 'org-1', name: 'Caritas' },
      } as any);
      const response = await POST(buildRequest({
        qrData: 'kykos:goods:deliver:req-fulfilled-1:user-donor-1',
      }));
      expect(response.status).toBe(403);
    });

    it('returns 404 when goods request does not exist', async () => {
      mockPrisma.goodsRequest.findUnique.mockResolvedValue(null);
      const response = await POST(buildRequest({
        qrData: 'kykos:goods:deliver:nonexistent:user-donor-1',
      }));
      expect(response.status).toBe(404);
    });
  });

  describe('happy path', () => {
    beforeEach(async () => {
      await authedAsOperator();
      mockPrisma.operator.findUnique.mockResolvedValue(operatorFixtures.withPermission as any);
      mockPrisma.goodsRequest.findUnique.mockResolvedValue({
        ...goodsRequestFixtures.fulfilled,
        beneficiary: { id: 'user-ben-1', name: 'Mario', email: 'mario@test.it' },
        fulfilledBy: { id: 'user-donor-1', name: 'Luca', email: 'luca@test.it' },
        intermediaryId: 'org-1',
        intermediary: {
          id: 'org-1',
          name: 'Caritas Roma',
          address: 'Via Roma',
          houseNumber: '1',
          cap: '00100',
          city: 'Roma',
          province: 'RM',
          phone: '0612345',
          email: 'caritas@test.it',
          hoursInfo: '9-17',
        },
      } as any);
      mockPrisma.goodsRequest.update.mockResolvedValue({
        ...goodsRequestFixtures.fulfilled,
        status: 'DELIVERED',
      });
      mockPrisma.notification.create.mockResolvedValue({} as any);
    });

    it('transitions FULFILLED → DELIVERED on valid scan', async () => {
      const response = await POST(buildRequest({
        qrData: 'kykos:goods:deliver:req-fulfilled-1:user-donor-1',
        depositLocation: 'Scaffale A',
        notes: 'Contattare il lunedì',
      }));
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.type).toBe('deliver');
      expect(mockPrisma.goodsRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DELIVERED',
            depositLocation: 'Scaffale A',
            depositNotes: 'Contattare il lunedì',
          }),
        })
      );
    });

    it('creates a notification for the beneficiary after delivery', async () => {
      const response = await POST(buildRequest({
        qrData: 'kykos:goods:deliver:req-fulfilled-1:user-donor-1',
      }));
      expect(response.status).toBe(200);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recipientUserId: 'user-ben-1',
            recipientType: 'USER',
          }),
        })
      );
    });
  });
});
