import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/operator-session', () => ({
  getOperatorSession: vi.fn(),
  requireOperator: vi.fn(),
  requireOperatorWithPermission: vi.fn(),
  OperatorAuthError: class OperatorAuthError extends Error {},
}));

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getOperatorSession } from '@/lib/operator-session';
import PwaEntry from '@/app/pwa/page';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);
// `redirect` from next/navigation throws a special error to abort the render.
// We mock it to throw a recognizable error so we can assert it was called.
const mockRedirect = vi.mocked(redirect);
mockRedirect.mockImplementation(((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
}) as any);
const mockGetSession = vi.mocked(getSession);
const mockGetOperatorSession = vi.mocked(getOperatorSession);

describe('/pwa dispatch', () => {
  beforeEach(() => {
    mockCookies.mockReset();
    mockJwtVerify.mockReset();
    mockRedirect.mockReset();
    mockGetSession.mockReset();
    mockGetOperatorSession.mockReset();
    // Re-apply the throw implementation after reset
    mockRedirect.mockImplementation(((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    }) as any);
  });

  async function expectRedirect(url: string) {
    await expect(PwaEntry()).rejects.toThrow(`NEXT_REDIRECT:${url}`);
  }

  it('redirects DONOR to /donor/dashboard', async () => {
    mockGetSession.mockResolvedValue({ id: 'u1', email: 'a@b.it', name: 'A', role: 'DONOR' } as any);
    await expectRedirect('/donor/dashboard');
  });

  it('redirects RECIPIENT to /recipient/dashboard', async () => {
    mockGetSession.mockResolvedValue({ id: 'u1', email: 'a@b.it', name: 'A', role: 'RECIPIENT' } as any);
    await expectRedirect('/recipient/dashboard');
  });

  it('redirects INTERMEDIARY to /intermediary/dashboard', async () => {
    mockGetSession.mockResolvedValue({ id: 'u1', email: 'a@b.it', name: 'A', role: 'INTERMEDIARY' } as any);
    await expectRedirect('/intermediary/dashboard');
  });

  it('redirects ADMIN to /admin/dashboard', async () => {
    mockGetSession.mockResolvedValue({ id: 'u1', email: 'a@b.it', name: 'A', role: 'ADMIN' } as any);
    await expectRedirect('/admin/dashboard');
  });

  it('redirects operator (operator_session cookie) to /operator/dashboard', async () => {
    mockGetSession.mockResolvedValue(null);
    mockGetOperatorSession.mockResolvedValue({ operatorId: 'op-1', organizationId: 'org-1' });
    await expectRedirect('/operator/dashboard');
  });

  it('redirects unauthenticated user to /', async () => {
    mockGetSession.mockResolvedValue(null);
    mockGetOperatorSession.mockResolvedValue(null);
    await expectRedirect('/');
  });
});
