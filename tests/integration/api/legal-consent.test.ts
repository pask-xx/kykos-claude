import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cookies } from 'next/headers';
import { mockPrisma, resetAllMocks, mockAuthSession } from '../../setup/mocks';
import { jwtVerify } from 'jose';

import { POST as consentPOST } from '@/app/api/legal/consent/route';
import { GET as statusGET } from '@/app/api/legal/status/route';
import { GET as checkGET } from '@/app/api/legal/check/route';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);

/**
 * In questo file di test, mockAuthSession (helper globale) non funziona
 * perché `require('jose')` in setup/mocks.ts non passa per il mock di Vitest.
 * Facciamo un override locale che usa `vi.mocked(jwtVerify)` direttamente.
 */
function setSession(userId: string | null) {
  if (userId) {
    mockCookies.mockResolvedValue({
      get: (name: string) => name === 'session' ? { value: 'mock-token' } : undefined,
    } as any);
    // NB: getSession() in src/lib/auth.ts returns payload.user (not payload)
    // so the mock must match the same shape.
    mockJwtVerify.mockResolvedValue({
      payload: { user: { id: userId, email: 'test@esempio.it', role: 'DONOR' } },
    } as any);
  } else {
    mockCookies.mockResolvedValue({
      get: () => undefined,
    } as any);
    mockJwtVerify.mockRejectedValue(new Error('invalid token'));
  }
}

function buildRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://test.local/api/legal/consent', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.42',
      'user-agent': 'vitest/1.0',
      ...headers,
    },
  });
}

describe('POST /api/legal/consent', () => {
  beforeEach(() => {
    resetAllMocks();
    mockPrisma.legalConsent.upsert.mockReset();
    mockPrisma.legalConsent.upsert.mockResolvedValue({} as any);
  });

  it('returns 401 when no session', async () => {
    setSession(null);
    const res = await consentPOST(buildRequest({ documentType: 'PRIVACY' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing or invalid documentType', async () => {
    setSession('user-1');
    const res1 = await consentPOST(buildRequest({}));
    expect(res1.status).toBe(400);

    const res2 = await consentPOST(buildRequest({ documentType: 'BOGUS' }));
    expect(res2.status).toBe(400);
  });

  it('upserts a LegalConsent with IP+UA from request headers', async () => {
    setSession('user-1');
    await consentPOST(buildRequest({ documentType: 'PRIVACY' }));

    expect(mockPrisma.legalConsent.upsert).toHaveBeenCalledTimes(1);
    const call = mockPrisma.legalConsent.upsert.mock.calls[0][0] as any;
    expect(call.where.userId_documentType_version).toEqual({
      userId: 'user-1',
      documentType: 'PRIVACY',
      version: '1.0',
    });
    expect(call.create.ipAddress).toBe('203.0.113.42');
    expect(call.create.userAgent).toBe('vitest/1.0');
    // Hash SHA-256 reale (64 hex chars) o fallback 'sha256:missing' se il
    // PDF non è stato deployato.
    expect(call.create.documentHash).toMatch(/^([a-f0-9]{64}|sha256:missing)$/);
  });

  it('uses first IP from x-forwarded-for list (Vercel proxy)', async () => {
    setSession('user-1');
    const req = buildRequest(
      { documentType: 'TERMS' },
      { 'x-forwarded-for': '198.51.100.7, 10.0.0.1, 10.0.0.2' }
    );
    await consentPOST(req);

    const call = mockPrisma.legalConsent.upsert.mock.calls[0][0] as any;
    expect(call.create.ipAddress).toBe('198.51.100.7');
  });

  it('returns 200 with the recorded version', async () => {
    setSession('user-1');
    const res = await consentPOST(buildRequest({ documentType: 'TERMS' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.documentType).toBe('TERMS');
    expect(data.version).toBe('1.0');
    expect(data.acceptedAt).toBeDefined();
  });
});

describe('GET /api/legal/status', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('returns 401 when no session', async () => {
    setSession(null);
    const res = await statusGET();
    expect(res.status).toBe(401);
  });

  it('reports outdated=true when user has no consent for the current version', async () => {
    setSession('user-1');
    mockPrisma.legalConsent.findFirst.mockResolvedValue(null);

    const res = await statusGET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.requiresReconsent).toBe(true);
    expect(data.documents.PRIVACY.outdated).toBe(true);
    expect(data.documents.PRIVACY.current).toBe('1.0');
    expect(data.documents.TERMS.outdated).toBe(true);
  });

  it('reports outdated=false when user has accepted current version', async () => {
    setSession('user-1');
    mockPrisma.legalConsent.findFirst.mockResolvedValue({ version: '1.0' } as any);

    const res = await statusGET();
    const data = await res.json();
    expect(data.requiresReconsent).toBe(false);
    expect(data.documents.PRIVACY.outdated).toBe(false);
    expect(data.documents.PRIVACY.accepted).toBe('1.0');
  });

  it('reports outdated=true when user has accepted an OLDER version (re-consent scenario)', async () => {
    setSession('user-1');
    // Simulate user accepted 0.9 in the past; current is 1.0
    mockPrisma.legalConsent.findFirst.mockResolvedValue({ version: '0.9' } as any);

    const res = await statusGET();
    const data = await res.json();
    expect(data.requiresReconsent).toBe(true);
    expect(data.documents.PRIVACY.accepted).toBe('0.9');
    expect(data.documents.PRIVACY.current).toBe('1.0');
  });
});

describe('GET /api/legal/check', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('returns 401 when no session', async () => {
    setSession(null);
    const res = await checkGET();
    expect(res.status).toBe(401);
  });

  it('returns requiresReconsent=true when either doc is missing', async () => {
    setSession('user-1');
    mockPrisma.legalConsent.findUnique.mockResolvedValue(null);
    const res = await checkGET();
    const data = await res.json();
    expect(data.requiresReconsent).toBe(true);
  });

  it('returns requiresReconsent=false when both docs are at current version', async () => {
    setSession('user-1');
    mockPrisma.legalConsent.findUnique.mockResolvedValue({ id: 'lc-1' } as any);
    const res = await checkGET();
    const data = await res.json();
    expect(data.requiresReconsent).toBe(false);
  });
});
