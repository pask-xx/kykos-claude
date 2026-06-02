import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mocks must come before importing the modules under test
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
}));

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getSession } from '@/lib/auth';
import { getOperatorSession, OperatorAuthError, requireOperator, requireOperatorWithPermission } from '@/lib/operator-session';
import { mockPrisma, resetAllMocks } from '../../setup/mocks';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);

describe('getSession (user)', () => {
  beforeEach(() => {
    resetAllMocks();
    mockCookies.mockReset();
    mockJwtVerify.mockReset();
  });

  it('returns null when no session cookie is present', async () => {
    mockCookies.mockResolvedValue({ get: () => undefined } as any);
    const result = await getSession();
    expect(result).toBeNull();
  });

  it('returns null when jwtVerify throws (expired or invalid token)', async () => {
    mockCookies.mockResolvedValue({ get: () => ({ value: 'bad-token' }) } as any);
    mockJwtVerify.mockRejectedValue(new Error('invalid signature'));
    const result = await getSession();
    expect(result).toBeNull();
  });

  it('returns the session payload when token is valid', async () => {
    const payload = { id: 'user-1', email: 'a@b.it', name: 'Mario', role: 'DONOR' };
    mockCookies.mockResolvedValue({ get: () => ({ value: 'good-token' }) } as any);
    mockJwtVerify.mockResolvedValue({ payload: { user: payload } } as any);
    const result = await getSession();
    expect(result).toEqual(payload);
  });
});

describe('getOperatorSession', () => {
  beforeEach(() => {
    resetAllMocks();
    mockCookies.mockReset();
    mockJwtVerify.mockReset();
  });

  it('returns null when no operator_session cookie', async () => {
    mockCookies.mockResolvedValue({ get: () => undefined } as any);
    const result = await getOperatorSession();
    expect(result).toBeNull();
  });

  it('returns null when jwtVerify throws', async () => {
    mockCookies.mockResolvedValue({ get: () => ({ value: 'bad' }) } as any);
    mockJwtVerify.mockRejectedValue(new Error('expired'));
    const result = await getOperatorSession();
    expect(result).toBeNull();
  });

  it('returns the operator session payload when valid', async () => {
    const payload = { operatorId: 'op-1', organizationId: 'org-1', role: 'GESTORE_RICHIESTE' };
    mockCookies.mockResolvedValue({ get: () => ({ value: 'good' }) } as any);
    mockJwtVerify.mockResolvedValue({ payload } as any);
    const result = await getOperatorSession();
    expect(result).toEqual(payload);
  });
});

describe('requireOperator', () => {
  beforeEach(() => {
    resetAllMocks();
    mockCookies.mockReset();
    mockJwtVerify.mockReset();
  });

  it('throws 401 when no session', async () => {
    mockCookies.mockResolvedValue({ get: () => undefined } as any);
    await expect(requireOperator()).rejects.toMatchObject({ status: 401 });
  });

  it('throws 404 when operator not found or inactive', async () => {
    mockCookies.mockResolvedValue({ get: () => ({ value: 'good' }) } as any);
    mockJwtVerify.mockResolvedValue({ payload: { operatorId: 'op-1', organizationId: 'org-1' } } as any);
    mockPrisma.operator.findUnique.mockResolvedValue(null);
    await expect(requireOperator()).rejects.toBeInstanceOf(OperatorAuthError);
    await expect(requireOperator()).rejects.toMatchObject({ status: 404 });
  });

  it('returns session and operator when valid and active', async () => {
    const opRecord = { id: 'op-1', role: 'ADMIN', permissions: [], active: true };
    mockCookies.mockResolvedValue({ get: () => ({ value: 'good' }) } as any);
    mockJwtVerify.mockResolvedValue({ payload: { operatorId: 'op-1', organizationId: 'org-1' } } as any);
    mockPrisma.operator.findUnique.mockResolvedValue(opRecord as any);
    const result = await requireOperator();
    expect(result.operator).toEqual(opRecord);
  });
});

describe('requireOperatorWithPermission', () => {
  beforeEach(() => {
    resetAllMocks();
    mockCookies.mockReset();
    mockJwtVerify.mockReset();
  });

  it('throws 403 when operator has none of the required permissions', async () => {
    const opRecord = { id: 'op-1', role: 'OPERATORE', permissions: [], active: true };
    mockCookies.mockResolvedValue({ get: () => ({ value: 'good' }) } as any);
    mockJwtVerify.mockResolvedValue({ payload: { operatorId: 'op-1', organizationId: 'org-1' } } as any);
    mockPrisma.operator.findUnique.mockResolvedValue(opRecord as any);
    await expect(
      requireOperatorWithPermission('RECIPIENT_AUTHORIZE')
    ).rejects.toMatchObject({ status: 403 });
  });

  it('returns operator when ADMIN (has all permissions)', async () => {
    const opRecord = { id: 'op-1', role: 'ADMIN', permissions: [], active: true };
    mockCookies.mockResolvedValue({ get: () => ({ value: 'good' }) } as any);
    mockJwtVerify.mockResolvedValue({ payload: { operatorId: 'op-1', organizationId: 'org-1' } } as any);
    mockPrisma.operator.findUnique.mockResolvedValue(opRecord as any);
    const result = await requireOperatorWithPermission('RECIPIENT_AUTHORIZE');
    expect(result.operator.role).toBe('ADMIN');
  });
});

describe('getJwtSecret (A6 — security)', () => {
  const ORIGINAL_ENV = process.env.JWT_SECRET;

  it('throws a clear error when JWT_SECRET is not set', async () => {
    // Force the module to reload without JWT_SECRET.
    delete process.env.JWT_SECRET;
    vi.resetModules();
    await expect(async () => {
      await import('@/lib/auth');
    }).rejects.toThrow(/JWT_SECRET.*required/i);
    process.env.JWT_SECRET = ORIGINAL_ENV;
  });

  it('does NOT fall back to a hardcoded public string', async () => {
    // Defense in depth: even if someone bypasses the throw and returns
    // a Uint8Array, the secret must not be the well-known 'kykos-secret-key-...'.
    delete process.env.JWT_SECRET;
    vi.resetModules();
    let caught: unknown = null;
    try {
      await import('@/lib/auth');
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).not.toContain('kykos-secret-key');
    process.env.JWT_SECRET = ORIGINAL_ENV;
  });
});
