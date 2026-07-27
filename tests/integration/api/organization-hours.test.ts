/**
 * Test integrazione API POST /api/organization/update — campi v2 hours + notes.
 *
 * Verifica:
 *   - Auth: 401 senza sessione, 403 se non INTERMEDIARY
 *   - Body con `hours` (array multi-slot v2) + `notes` → persistiti su Organization
 *   - Body con `hours: null` → reset (null persistito)
 *   - Body senza `hours` né `notes` → non vengono toccati (undefined → skip)
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

import { POST } from '@/app/api/organization/update/route';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);

const ORG_ID = 'org-1';
const USER_ID = 'user-intermediary';

function buildRequest(body: unknown): Request {
  return new Request('http://test.local', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

async function authedAsIntermediary() {
  mockCookies.mockResolvedValue({
    get: vi.fn((name: string) =>
      name === 'session' ? { value: 'mock-jwt' } : undefined
    ),
  } as never);
  mockJwtVerify.mockResolvedValue({
    payload: { user: { id: USER_ID, role: 'INTERMEDIARY' } },
  } as never);
}

beforeEach(() => {
  resetAllMocks();
  mockPrisma.organization.findUnique.mockResolvedValue({ id: ORG_ID });
  mockPrisma.organization.update.mockImplementation(async ({ data }: any) => ({
    id: ORG_ID,
    ...data,
  }));
});

describe('POST /api/organization/update — hours multi-slot v2 + notes', () => {
  it('401 senza sessione', async () => {
    mockCookies.mockResolvedValue({ get: vi.fn(() => undefined) } as never);
    const res = await POST(buildRequest({}), undefined as any);
    expect(res.status).toBe(401);
  });

  it('403 se il ruolo non è INTERMEDIARY', async () => {
    mockCookies.mockResolvedValue({
      get: vi.fn((n: string) => (n === 'session' ? { value: 'x' } : undefined)),
    } as never);
    mockJwtVerify.mockResolvedValue({
      payload: { user: { id: USER_ID, role: 'DONOR' } },
    } as never);
    const res = await POST(buildRequest({}), undefined as any);
    expect(res.status).toBe(403);
  });

  it('404 se l\'organization non esiste', async () => {
    await authedAsIntermediary();
    mockPrisma.organization.findUnique.mockResolvedValue(null);
    const res = await POST(buildRequest({}), undefined as any);
    expect(res.status).toBe(404);
  });

  it('accetta hours array v2 multi-slot e notes', async () => {
    await authedAsIntermediary();
    const hours = {
      monday: [
        { open: '09:00', close: '12:00' },
        { open: '15:00', close: '18:00' },
      ],
      tuesday: [{ open: '09:00', close: '13:00' }],
    };
    const res = await POST(
      buildRequest({ hours, notes: 'Suonare il campanello' }),
      undefined as any
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.organization.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ORG_ID },
        data: expect.objectContaining({
          hours,
          notes: 'Suonare il campanello',
        }),
      })
    );
  });

  it('accetta hours: null per il reset', async () => {
    await authedAsIntermediary();
    const res = await POST(buildRequest({ hours: null }), undefined as any);
    expect(res.status).toBe(200);
    expect(mockPrisma.organization.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ hours: null }),
      })
    );
  });

  it('accetta notes: null per il reset', async () => {
    await authedAsIntermediary();
    const res = await POST(buildRequest({ notes: null }), undefined as any);
    expect(res.status).toBe(200);
    expect(mockPrisma.organization.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ notes: null }),
      })
    );
  });

  it('accetta notes: stringa vuota → salvato come null', async () => {
    await authedAsIntermediary();
    const res = await POST(buildRequest({ notes: '' }), undefined as any);
    expect(res.status).toBe(200);
    expect(mockPrisma.organization.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ notes: null }),
      })
    );
  });

  it('body senza hours/notes → non li tocca (undefined salta il campo)', async () => {
    await authedAsIntermediary();
    const res = await POST(
      buildRequest({ address: 'Via Roma 1' }),
      undefined as any
    );
    expect(res.status).toBe(200);
    const updateCall = mockPrisma.organization.update.mock.calls[0][0];
    expect(updateCall.data.hours).toBeUndefined();
    expect(updateCall.data.notes).toBeUndefined();
  });
});