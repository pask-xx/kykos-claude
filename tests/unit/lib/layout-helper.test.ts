import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma, resetAllMocks } from '../../setup/mocks';

// `next/navigation` redirect is a real symbol; we override it to throw so we can assert on it.
// It must be hoisted before any import of the module under test.
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import { requireUserSession, KYKOS_VIEWPORT } from '@/lib/layout-helper';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);
const mockRedirect = vi.mocked(redirect) as unknown as ReturnType<typeof vi.fn> & {
  mockImplementation: (fn: any) => any;
  mockReset: () => any;
  mockResolvedValue: (v: any) => any;
};

function installRedirect() {
  mockRedirect.mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  });
}

function authAs(role: 'DONOR' | 'RECIPIENT' | 'INTERMEDIARY' | 'ADMIN' | null, id = 'u-1') {
  mockCookies.mockResolvedValue({
    get: (name: string) => (name === 'session' ? { value: 'valid' } : undefined),
  } as any);
  if (role === null) {
    mockJwtVerify.mockResolvedValue({ payload: {} } as any);
  } else {
    mockJwtVerify.mockResolvedValue({
      payload: { user: { id, email: 'a@b.it', name: 'Test', role } },
    } as any);
  }
}

describe('requireUserSession (E2 — layout helper)', () => {
  beforeEach(() => {
    resetAllMocks();
    mockCookies.mockReset();
    mockJwtVerify.mockReset();
    mockRedirect.mockReset();
    installRedirect();
  });

  it('redirects to /auth/login when no session is present', async () => {
    authAs(null);
    await expect(requireUserSession('DONOR')).rejects.toThrow('NEXT_REDIRECT:/auth/login');
  });

  it("redirects to the caller's own dashboard when role does not match", async () => {
    authAs('RECIPIENT');
    await expect(requireUserSession('DONOR')).rejects.toThrow('NEXT_REDIRECT:/recipient/dashboard');
  });

  it('redirects to /auth/login when the user record does not exist in DB', async () => {
    authAs('DONOR');
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(requireUserSession('DONOR')).rejects.toThrow('NEXT_REDIRECT:/auth/login');
  });

  it('returns a normalized LayoutUser with name, role, and profileImageUrl', async () => {
    authAs('DONOR');
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u-1',
      email: 'mario@test.it',
      firstName: 'Mario',
      lastName: 'Rossi',
      name: null,
      role: 'DONOR',
      profileImageUrl: 'https://cdn/p.jpg',
    } as any);

    const { user } = await requireUserSession('DONOR');
    expect(user).toEqual({
      id: 'u-1',
      email: 'mario@test.it',
      name: 'Mario Rossi',
      role: 'DONOR',
      profileImageUrl: 'https://cdn/p.jpg',
    });
  });

  it('prefers the user.name field over firstName+lastName when present', async () => {
    authAs('ADMIN');
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u-2',
      email: 'admin@test.it',
      firstName: 'Anna',
      lastName: 'Bianchi',
      name: 'Anna B. (display)',
      role: 'ADMIN',
      profileImageUrl: null,
    } as any);

    const { user } = await requireUserSession('ADMIN');
    expect(user.name).toBe('Anna B. (display)');
  });

  it('falls back to email when both name and firstName/lastName are empty', async () => {
    authAs('RECIPIENT');
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u-3',
      email: 'orphan@test.it',
      firstName: '',
      lastName: '',
      name: null,
      role: 'RECIPIENT',
      profileImageUrl: null,
    } as any);

    const { user } = await requireUserSession('RECIPIENT');
    expect(user.name).toBe('orphan@test.it');
  });

  it('KYKOS_VIEWPORT is the canonical viewport shape (themeColor #2563eb)', () => {
    expect(KYKOS_VIEWPORT.themeColor).toBe('#2563eb');
    expect(KYKOS_VIEWPORT.width).toBe('device-width');
    expect(KYKOS_VIEWPORT.initialScale).toBe(1);
  });
});
