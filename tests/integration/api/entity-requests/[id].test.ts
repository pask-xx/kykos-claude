import { describe, it, expect, vi, beforeEach } from 'vitest';
import { goodsRequestFixtures, operatorFixtures } from '../../../setup/fixtures/goods-requests';
import { mockPrisma, resetAllMocks } from '../../../setup/mocks';

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { PATCH } from '@/app/api/entity-requests/[id]/route';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);

function buildRequest(body: unknown): Request {
  return new Request('http://test.local/api/entity-requests/req-1', {
    method: 'PATCH',
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

describe('PATCH /api/entity-requests/[id] - approve/reject', () => {
  beforeEach(() => {
    resetAllMocks();
    mockCookies.mockReset();
    mockJwtVerify.mockReset();
  });

  describe('action: approve', () => {
    it('approves a PENDING request and notifies the beneficiary', async () => {
      await authedAsOperator();
      mockPrisma.goodsRequest.findUnique.mockResolvedValue({
        ...goodsRequestFixtures.pending,
        beneficiary: { id: 'user-ben-1', name: 'Mario', email: 'mario@test.it' },
        intermediary: { id: 'org-1', name: 'Caritas' },
      } as any);
      mockPrisma.operator.findUnique.mockResolvedValue(operatorFixtures.withPermission as any);
      mockPrisma.goodsRequest.update.mockResolvedValue({
        ...goodsRequestFixtures.pending,
        status: 'APPROVED',
      } as any);
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' } as any);

      const response = await PATCH(buildRequest({
        requestId: 'req-pending-1',
        action: 'approve',
      }));
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(mockPrisma.goodsRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'APPROVED' }),
        })
      );
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recipientUserId: 'user-ben-1',
            title: expect.stringMatching(/approvata/i),
          }),
        })
      );
    });

    it('returns 403 when operator is from a different organization', async () => {
      await authedAsOperator('org-other');
      mockPrisma.goodsRequest.findUnique.mockResolvedValue({
        ...goodsRequestFixtures.pending,
        intermediaryId: 'org-1', // request belongs to org-1, operator is in org-other
        beneficiary: { id: 'user-ben-1', name: 'Mario', email: 'mario@test.it' },
        intermediary: { id: 'org-1', name: 'Caritas' },
      } as any);

      const response = await PATCH(buildRequest({
        requestId: 'req-pending-1',
        action: 'approve',
      }));
      expect(response.status).toBe(403);
    });

    it('returns 403 when operator lacks RECIPIENT_AUTHORIZE permission', async () => {
      await authedAsOperator();
      mockPrisma.goodsRequest.findUnique.mockResolvedValue({
        ...goodsRequestFixtures.pending,
        beneficiary: { id: 'user-ben-1', name: 'Mario', email: 'mario@test.it' },
        intermediary: { id: 'org-1', name: 'Caritas' },
      } as any);
      mockPrisma.operator.findUnique.mockResolvedValue(operatorFixtures.withoutPermission as any);

      const response = await PATCH(buildRequest({
        requestId: 'req-pending-1',
        action: 'approve',
      }));
      expect(response.status).toBe(403);
    });
  });

  describe('action: reject', () => {
    it('cancels a PENDING request and notifies the beneficiary', async () => {
      await authedAsOperator();
      mockPrisma.goodsRequest.findUnique.mockResolvedValue({
        ...goodsRequestFixtures.pending,
        beneficiary: { id: 'user-ben-1', name: 'Mario', email: 'mario@test.it' },
        intermediary: { id: 'org-1', name: 'Caritas' },
      } as any);
      mockPrisma.operator.findUnique.mockResolvedValue(operatorFixtures.withPermission as any);
      mockPrisma.goodsRequest.update.mockResolvedValue({
        ...goodsRequestFixtures.pending,
        status: 'CANCELLED',
      } as any);
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' } as any);

      const response = await PATCH(buildRequest({
        requestId: 'req-pending-1',
        action: 'reject',
      }));
      expect(response.status).toBe(200);
      expect(mockPrisma.goodsRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'CANCELLED' }),
        })
      );
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recipientUserId: 'user-ben-1',
            title: expect.stringMatching(/rifiutata/i),
          }),
        })
      );
    });

    it('returns 403 when operator is from a different organization', async () => {
      await authedAsOperator('org-other');
      mockPrisma.goodsRequest.findUnique.mockResolvedValue({
        ...goodsRequestFixtures.pending,
        intermediaryId: 'org-1',
        beneficiary: { id: 'user-ben-1', name: 'Mario', email: 'mario@test.it' },
        intermediary: { id: 'org-1', name: 'Caritas' },
      } as any);

      const response = await PATCH(buildRequest({
        requestId: 'req-pending-1',
        action: 'reject',
      }));
      expect(response.status).toBe(403);
    });
  });

  describe('input validation', () => {
    it('returns 401 when no operator or user session is present', async () => {
      mockCookies.mockResolvedValue({ get: () => undefined } as any);
      const response = await PATCH(buildRequest({
        requestId: 'req-pending-1',
        action: 'approve',
      }));
      expect(response.status).toBe(401);
    });

    it('returns 400 when requestId is missing', async () => {
      await authedAsOperator();
      const response = await PATCH(buildRequest({ action: 'approve' }));
      expect(response.status).toBe(400);
    });

    it('returns 400 when action is missing', async () => {
      await authedAsOperator();
      const response = await PATCH(buildRequest({ requestId: 'req-pending-1' }));
      expect(response.status).toBe(400);
    });

    it('returns 404 when goods request does not exist', async () => {
      await authedAsOperator();
      mockPrisma.goodsRequest.findUnique.mockResolvedValue(null);
      const response = await PATCH(buildRequest({
        requestId: 'nonexistent',
        action: 'approve',
      }));
      expect(response.status).toBe(404);
    });
  });
});
