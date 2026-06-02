import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma, resetAllMocks } from '../../setup/mocks';

import { cookies } from 'next/headers';
import { POST } from '@/app/api/auth/login/route';

const mockCookies = vi.mocked(cookies);
const { supabaseAdmin } = await import('@/lib/supabase');
const mockSupabaseSignIn = vi.mocked(supabaseAdmin.auth.signInWithPassword);

function buildRequest(body: unknown): Request {
  return new Request('http://test.local/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/auth/login - Email Normalization (Regola #1)', () => {
  beforeEach(() => {
    resetAllMocks();
    mockCookies.mockReset();
    mockCookies.mockResolvedValue({
      set: vi.fn(),
      get: () => undefined,
    } as any);
    mockPrisma.user.findUnique.mockReset();
  });

  it('returns 400 when email or password is missing', async () => {
    const response = await POST(buildRequest({ email: 'a@b.it' }));
    expect(response.status).toBe(400);
  });

  it('lowercases the email before calling Supabase Auth', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u-1',
      email: 'mario@esempio.it',
      name: 'Mario',
      role: 'DONOR',
      emailConfirmed: true,
    } as any);

    await POST(buildRequest({
      email: 'Mario@Esempio.IT',
      password: 'secret',
    }));

    expect(mockSupabaseSignIn).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'mario@esempio.it' })
    );
  });

  it('trims whitespace from the email before comparing (BUG: currently does NOT trim)', async () => {
    // BUG REPRODUCED: the route calls email.toLowerCase() but not email.trim().
    // If a user pastes "  mario@esempio.it  " they will get a 401.
    // This test FAILS the bug to document it. The fix is in Fase 2 (audit A6 area).
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u-1',
      email: 'mario@esempio.it',
      name: 'Mario',
      role: 'DONOR',
      emailConfirmed: true,
    } as any);

    const response = await POST(buildRequest({
      email: '  mario@esempio.it  ',
      password: 'secret',
    }));

    // Document the current (buggy) behavior: 200 means trim is working
    // 401 means trim is NOT working. This test asserts the desired behavior.
    expect(response.status).toBe(200);
  });

  it('returns 401 when Supabase Auth rejects the credentials', async () => {
    mockSupabaseSignIn.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' } as any,
    } as any);

    const response = await POST(buildRequest({
      email: 'wrong@test.it',
      password: 'bad',
    }));
    expect(response.status).toBe(401);
  });

  it('returns 401 when KYKOS user does not exist (even if Supabase auth succeeded)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const response = await POST(buildRequest({
      email: 'mario@esempio.it',
      password: 'secret',
    }));
    expect(response.status).toBe(401);
  });

  it('returns 403 when user has not confirmed email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u-1',
      email: 'mario@esempio.it',
      name: 'Mario',
      role: 'DONOR',
      emailConfirmed: false, // not yet confirmed
    } as any);
    const response = await POST(buildRequest({
      email: 'mario@esempio.it',
      password: 'secret',
    }));
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toMatch(/confermare/i);
  });

  it('sets the session cookie on successful login and returns user data', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u-1',
      email: 'mario@esempio.it',
      name: 'Mario',
      role: 'DONOR',
      emailConfirmed: true,
    } as any);

    const response = await POST(buildRequest({
      email: 'mario@esempio.it',
      password: 'secret',
    }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.user).toMatchObject({
      id: 'u-1',
      email: 'mario@esempio.it',
      role: 'DONOR',
    });
  });
});
