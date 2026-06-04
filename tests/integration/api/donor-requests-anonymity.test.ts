import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
}));

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { GET } from '@/app/api/donor/requests/route';
import { mockPrisma, resetAllMocks } from '../../setup/mocks';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);

async function authedAsDonor() {
  const payload = { id: 'donor-1', email: 'donor@test.it', name: 'Mario', role: 'DONOR' };
  mockCookies.mockResolvedValue({ get: () => ({ value: 'valid-token' }) } as any);
  mockJwtVerify.mockResolvedValue({ payload: { user: payload } } as any);
  return payload;
}

describe('GET /api/donor/requests — anonymity (Regola #1)', () => {
  beforeEach(() => {
    resetAllMocks();
    mockCookies.mockReset();
    mockJwtVerify.mockReset();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.goodsOffer.findMany.mockReset();
    mockPrisma.goodsRequest.findMany.mockReset();
  });

  it('returns 401 when no session is present', async () => {
    mockCookies.mockResolvedValue({ get: () => undefined } as any);
    const response = await GET(new Request('http://test.local/api/donor/requests'));
    expect(response.status).toBe(401);
  });

  it('returns 403 when the caller is not a DONOR', async () => {
    await authedAsDonor();
    // Force a different role
    mockJwtVerify.mockResolvedValue({
      payload: { user: { id: 'r-1', email: 'r@t.it', name: 'R', role: 'RECIPIENT' } },
    } as any);
    const response = await GET(new Request('http://test.local/api/donor/requests'));
    expect(response.status).toBe(403);
  });

  it('does NOT include any beneficiary personal data in the response', async () => {
    await authedAsDonor();
    mockPrisma.user.findUnique.mockResolvedValue({ canProvideServices: false } as any);
    mockPrisma.goodsOffer.findMany.mockResolvedValue([]);
    // Simulate a request that, in the DB, has a beneficiary with full PII.
    // The route must not leak ANY of it.
    const requestFromDb = {
      id: 'req-1',
      title: 'Letto singolo',
      description: 'Per bambino',
      category: 'FURNITURE',
      status: 'APPROVED',
      type: 'GOODS',
      fulfilledById: null,
      createdAt: new Date('2026-01-01'),
      beneficiaryId: 'ben-1',
      beneficiary: { id: 'ben-1' }, // The route is supposed to be anonymous
      intermediary: { id: 'org-1', name: 'Caritas Roma' },
      _count: { offers: 2 },
    };
    mockPrisma.goodsRequest.findMany.mockResolvedValue([requestFromDb] as any);

    const response = await GET(new Request('http://test.local/api/donor/requests'));
    expect(response.status).toBe(200);

    const body = await response.json();
    const item = body.requests[0];

    // The flat beneficiaryId must be stripped (already done in code, but document it)
    expect(item.beneficiaryId).toBeUndefined();

    // CRITICAL: the nested beneficiary object must NOT be exposed at all.
    // If beneficiary: { id } leaks, the donor can re-identify the recipient
    // by correlating with other data sources (timeline, etc).
    expect(item.beneficiary).toBeUndefined();

    // Belt and braces: even if a future refactor reintroduces the include,
    // these fields must never appear.
    const serialized = JSON.stringify(item);
    expect(serialized).not.toMatch(/ben-1/); // beneficiary id
    expect(serialized).not.toContain('"name":"Mario Rossi"');
    expect(serialized).not.toContain('"email"');
    expect(serialized).not.toContain('"firstName"');
    expect(serialized).not.toContain('"lastName"');
    expect(serialized).not.toContain('"fiscalCode"');
  });

  it('exposes the intermediary name (intermediaries are visible to donors)', async () => {
    await authedAsDonor();
    mockPrisma.user.findUnique.mockResolvedValue({ canProvideServices: false } as any);
    mockPrisma.goodsOffer.findMany.mockResolvedValue([]);
    mockPrisma.goodsRequest.findMany.mockResolvedValue([
      {
        id: 'req-1',
        title: 'Titolo',
        status: 'APPROVED',
        type: 'GOODS',
        fulfilledById: null,
        createdAt: new Date('2026-01-01'),
        beneficiaryId: 'ben-1',
        beneficiary: { id: 'ben-1' },
        intermediary: { id: 'org-1', name: 'Caritas Roma' },
        _count: { offers: 0 },
      },
    ] as any);

    const response = await GET(new Request('http://test.local/api/donor/requests'));
    const body = await response.json();
    // Intermediary name IS allowed: the donor will physically deliver to the intermediary.
    expect(body.requests[0].intermediary.name).toBe('Caritas Roma');
  });

  it('marks already-offered requests with alreadyOffered=true', async () => {
    await authedAsDonor();
    mockPrisma.user.findUnique.mockResolvedValue({ canProvideServices: false } as any);
    mockPrisma.goodsOffer.findMany.mockResolvedValue([{ requestId: 'req-1' }] as any);
    mockPrisma.goodsRequest.findMany.mockResolvedValue([
      {
        id: 'req-1',
        title: 'Titolo',
        status: 'APPROVED',
        type: 'GOODS',
        fulfilledById: null,
        createdAt: new Date('2026-01-01'),
        beneficiaryId: 'ben-1',
        beneficiary: { id: 'ben-1' },
        intermediary: { id: 'org-1', name: 'Caritas' },
        _count: { offers: 1 },
      },
    ] as any);

    const response = await GET(new Request('http://test.local/api/donor/requests'));
    const body = await response.json();
    expect(body.requests[0].alreadyOffered).toBe(true);
  });
});
