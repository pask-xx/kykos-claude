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
  userId = 'user-1'
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

describe('GET /api/objects — smoke auth (regression baseline)', () => {
  beforeEach(() => {
    resetAllMocks();
    mockCookies.mockReset();
    mockJwtVerify.mockReset();
  });

  it('ritorna 401 senza sessione', async () => {
    mockCookies.mockResolvedValue({ get: () => undefined } as any);
    const response = await GETObjects(new Request('http://test/api/objects'), undefined as any);
    expect(response.status).toBe(401);
  });

  it('ritorna 200 con DONOR autenticato (no regression sul path DONOR)', async () => {
    await authedAs('DONOR', 'donor-1');
    mockPrisma.object.findMany.mockResolvedValue([]);

    const response = await GETObjects(new Request('http://test/api/objects'), undefined as any);

    expect(response.status).toBe(200);
    // DONOR: nessuna chiamata al lookup User per scope recipient
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });
});