import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('jose', () => ({ jwtVerify: vi.fn() }));

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { POST } from '@/app/api/profile/deactivate/route';
import { mockPrisma, resetAllMocks } from '../../setup/mocks';
import { supabaseAdmin } from '@/lib/supabase';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);

// Mock of supabaseAdmin.auth.admin.deleteUser (already partially in mocks.ts).
// We override it per-test to control failure patterns.
const mockSupabaseDelete = vi.fn();
(supabaseAdmin.auth.admin as any).deleteUser = mockSupabaseDelete;

async function authAsUser(id = 'u-1', email = 'user@test.it', authUserId = 'supabase-uid-1') {
  mockCookies.mockImplementation(async () => ({
    get: (name: string) => (name === 'session' ? { value: 'valid' } : undefined),
    delete: () => undefined,
  }) as any);
  mockJwtVerify.mockImplementation(async () => ({
    payload: { user: { id, email, name: 'Test User', role: 'DONOR' } },
  }) as any);

  // The route calls prisma.user.findUnique AFTER the transaction (for the
  // Supabase step). Provide the user record with authUserId.
  mockPrisma.user.findUnique.mockImplementation(async (args: any) => {
    if (args?.where?.id === id) {
      return { id, email, authUserId };
    }
    return null;
  });
}

function setupEmptyUser(id = 'u-1') {
  // Cascade: no objects, offers, requests, goodsRequests for this user
  mockPrisma.object.findMany.mockImplementation(async () => [] as any);
  mockPrisma.goodsOffer.findMany.mockImplementation(async () => [] as any);
  mockPrisma.request.findMany.mockImplementation(async () => [] as any);
  mockPrisma.goodsRequest.findMany.mockImplementation(async () => [] as any);
  mockPrisma.user.update.mockImplementation(async (args: any) => ({ id: args.where.id, ...args.data }) as any);
}

beforeEach(() => {
  resetAllMocks();
  mockCookies.mockReset();
  mockJwtVerify.mockReset();
  mockSupabaseDelete.mockReset();
});

describe('POST /api/profile/deactivate — B2 (soft-delete + Supabase retry)', () => {
  it('soft-deletes the KYKOS user and calls Supabase once when deleteUser succeeds', async () => {
    await authAsUser();
    setupEmptyUser();

    mockSupabaseDelete.mockImplementation(async () => ({ data: null, error: null }));

    const response = await POST();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.actions).toBeDefined();
    expect(body.actions.some((a: string) => a.includes('soft-deleted'))).toBe(true);
    expect(body.actions.some((a: string) => a.includes('Supabase Auth eliminato'))).toBe(true);

    // KYKOS user soft-delete: prisma.user.update called with deactivatedAt
    const updateCalls = mockPrisma.user.update.mock.calls;
    const softDeleteCall = updateCalls.find((c: any[]) => c[0]?.data?.deactivatedAt);
    expect(softDeleteCall).toBeDefined();

    // Supabase deleteUser called exactly once
    expect(mockSupabaseDelete).toHaveBeenCalledTimes(1);
    expect(mockSupabaseDelete).toHaveBeenCalledWith('supabase-uid-1');

    // After successful Supabase delete, authUserId is nulled
    const finalUpdate = updateCalls[updateCalls.length - 1];
    expect(finalUpdate[0]?.data?.authUserId).toBeNull();
  });

  it('returns 500 when Supabase deleteUser fails on all 3 attempts (and keeps authUserId for cron cleanup)', async () => {
    await authAsUser();
    setupEmptyUser();

    // Mock deleteUser to ALWAYS return a real error (NOT "not found")
    mockSupabaseDelete.mockImplementation(async () => ({
      data: null,
      error: { message: 'Internal Server Error' },
    }));

    const response = await POST();
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.supabaseOk).toBe(false);
    expect(body.message).toMatch(/Supabase Auth non ha risposto/);
    expect(body.actions.some((a: string) => a.includes('fallita dopo 3 tentativi'))).toBe(true);

    // 3 retry attempts
    expect(mockSupabaseDelete).toHaveBeenCalledTimes(3);

    // authUserId NOT nulled: kept for future cron retry
    const updateCalls = mockPrisma.user.update.mock.calls;
    const nullAuthCall = updateCalls.find((c: any[]) => c[0]?.data?.authUserId === null);
    expect(nullAuthCall).toBeUndefined();

    // BUT soft-delete WAS applied (KYKOS state is consistent)
    const softDeleteCall = updateCalls.find((c: any[]) => c[0]?.data?.deactivatedAt);
    expect(softDeleteCall).toBeDefined();
  });

  it('treats "user not found" as success (idempotent retry)', async () => {
    await authAsUser();
    setupEmptyUser();

    mockSupabaseDelete.mockImplementation(async () => ({
      data: null,
      error: { message: 'User not found' },
    }));

    const response = await POST();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);

    // deleteUser called exactly once, then returned success because of not-found
    expect(mockSupabaseDelete).toHaveBeenCalledTimes(1);

    // authUserId nulled (the "not found" case is success)
    const updateCalls = mockPrisma.user.update.mock.calls;
    const nullAuthCall = updateCalls.find((c: any[]) => c[0]?.data?.authUserId === null);
    expect(nullAuthCall).toBeDefined();
  });

  it('returns 200 after retry succeeds (failure 1, then success)', async () => {
    await authAsUser();
    setupEmptyUser();

    let attempt = 0;
    mockSupabaseDelete.mockImplementation(async () => {
      attempt++;
      if (attempt === 1) {
        return { data: null, error: { message: 'Service Unavailable' } };
      }
      return { data: null, error: null };
    });

    const response = await POST();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(mockSupabaseDelete).toHaveBeenCalledTimes(2);
  });

  it('returns 401 when no session is present', async () => {
    mockCookies.mockImplementation(async () => ({
      get: () => undefined,
      delete: () => undefined,
    }) as any);

    const response = await POST();
    expect(response.status).toBe(401);
    // No Supabase call
    expect(mockSupabaseDelete).not.toHaveBeenCalled();
  });

  it('does not call Supabase when user has no authUserId (legacy email-only account)', async () => {
    // authUserId is null: this user was created before Supabase Auth integration
    await authAsUser('u-1', 'legacy@test.it', null as any);
    setupEmptyUser();

    const response = await POST();
    expect(response.status).toBe(200);

    // Supabase never called
    expect(mockSupabaseDelete).not.toHaveBeenCalled();

    // Soft-delete still applied
    const updateCalls = mockPrisma.user.update.mock.calls;
    const softDeleteCall = updateCalls.find((c: any[]) => c[0]?.data?.deactivatedAt);
    expect(softDeleteCall).toBeDefined();
  });

  it('cascades object state changes inside the transaction (AVAILABLE -> CANCELLED)', async () => {
    await authAsUser();
    mockSupabaseDelete.mockImplementation(async () => ({ data: null, error: null }));

    // One AVAILABLE object published by this user
    mockPrisma.object.findMany.mockImplementation(async () => [
      { id: 'obj-1', title: 'Sedia', status: 'AVAILABLE', requests: [] },
    ] as any);
    mockPrisma.goodsOffer.findMany.mockImplementation(async () => [] as any);
    mockPrisma.request.findMany.mockImplementation(async () => [] as any);
    mockPrisma.goodsRequest.findMany.mockImplementation(async () => [] as any);

    const objectUpdates: any[] = [];
    mockPrisma.object.update.mockImplementation(async (args: any) => {
      objectUpdates.push(args);
      return { id: args.where.id, ...args.data };
    });
    mockPrisma.user.update.mockImplementation(async (args: any) => ({ id: args.where.id, ...args.data }) as any);

    const response = await POST();
    expect(response.status).toBe(200);

    // Object was set to CANCELLED
    expect(objectUpdates).toHaveLength(1);
    expect(objectUpdates[0].data.status).toBe('CANCELLED');
  });

  it('cascades RESERVED object: cancels request, sends notification to recipient', async () => {
    await authAsUser();
    mockSupabaseDelete.mockImplementation(async () => ({ data: null, error: null }));

    mockPrisma.object.findMany.mockImplementation(async () => [
      { id: 'obj-1', title: 'Letto', status: 'RESERVED', requests: [{ id: 'req-1', status: 'APPROVED' }] },
    ] as any);
    mockPrisma.goodsOffer.findMany.mockImplementation(async () => [] as any);
    mockPrisma.request.findMany.mockImplementation(async () => [] as any);
    mockPrisma.goodsRequest.findMany.mockImplementation(async () => [] as any);
    mockPrisma.request.findUnique.mockImplementation(async () => ({
      id: 'req-1',
      recipient: { id: 'r-1', email: 'r@test.it', name: 'Recipient' },
    }) as any);

    const requestUpdates: any[] = [];
    const notifications: any[] = [];
    const objectUpdates: any[] = [];
    mockPrisma.request.update.mockImplementation(async (args: any) => {
      requestUpdates.push(args);
      return { id: args.where.id, ...args.data };
    });
    mockPrisma.object.update.mockImplementation(async (args: any) => {
      objectUpdates.push(args);
      return { id: args.where.id, ...args.data };
    });
    mockPrisma.notification.create.mockImplementation(async (args: any) => {
      notifications.push(args);
      return { id: 'notif' };
    });
    mockPrisma.user.update.mockImplementation(async (args: any) => ({ id: args.where.id, ...args.data }) as any);

    const response = await POST();
    expect(response.status).toBe(200);

    // Request was cancelled
    expect(requestUpdates.length).toBeGreaterThanOrEqual(1);
    expect(requestUpdates[0].data.status).toBe('CANCELLED');
    // Object was cancelled
    expect(objectUpdates.some((u) => u.data.status === 'CANCELLED')).toBe(true);
    // Notification to the recipient was created
    expect(notifications.length).toBeGreaterThanOrEqual(1);
    expect(notifications[0].data.recipientUserId).toBe('r-1');
  });
});
