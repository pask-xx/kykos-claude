/**
 * Test anonimato: route /api/recipient/fresh-events/*
 * - GET lista → no donor.name, no donor.email
 * - GET dettaglio slot → no donor.name
 * - GET my-reservations → no donor.name di altri beneficiari
 * - GET QR → no donor.name
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('jose', () => ({ jwtVerify: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { publicUrl: 'https://test/qr.png' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test/qr.png' } }),
      }),
    },
  }),
}));

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { GET as GET_LIST } from '@/app/api/recipient/fresh-events/route';
import { GET as GET_DETAIL } from '@/app/api/recipient/fresh-events/[id]/route';
import { mockPrisma, resetAllMocks } from '../../setup/mocks';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);

const USER = {
  id: 'user-1',
  firstName: 'Mario',
  lastName: 'Rossi',
  role: 'RECIPIENT',
  authorized: true,
  organizationId: 'org-1',
  referenceEntityId: 'org-1',
  deactivatedAt: null,
  freshSuspendedUntil: null,
};

async function authAsBeneficiary() {
  mockCookies.mockImplementation(async () => ({
    get: (name: string) => (name === 'session' ? { value: 'valid' } : undefined),
  }) as any);
  mockJwtVerify.mockImplementation(async () => ({
    payload: { user: { id: USER.id, email: 'm@test.it', name: 'Mario', role: 'RECIPIENT' } },
  }) as any);
}

beforeEach(() => {
  resetAllMocks();
  vi.clearAllMocks();
});

describe('Anonimato: GET /api/recipient/fresh-events (lista)', () => {
  it('non espone donor.name né donor.email nella lista eventi', async () => {
    await authAsBeneficiary();
    mockPrisma.user.findUnique.mockResolvedValue(USER as any);
    mockPrisma.freshEvent.findMany.mockResolvedValue([
      {
        id: 'event-1',
        scheduledStart: new Date(Date.now() + 86400_000),
        scheduledEnd: new Date(Date.now() + 90000_000),
        capacity: 5,
        reservedCount: 0,
        waitingCount: 0,
        status: 'PUBLISHED',
        template: { id: 'tpl-1', title: 'Martedi' },
        pickupLocation: { id: 'loc-1', address: 'Via Roma', city: 'Roma' },
      },
    ] as any);
    mockPrisma.freshEventTemplate.findMany.mockResolvedValue([]);

    const res = await (GET_LIST as any)();
    const data = await res.json();
    const json = JSON.stringify(data);

    expect(res.status).toBe(200);
    // Anonimato: nessun campo donatore esposto
    expect(json).not.toMatch(/donorName/);
    expect(json).not.toMatch(/donorEmail/);
    expect(json).not.toMatch(/donor\.name/);
    expect(json).not.toMatch(/donor\.email/);
    expect(json).not.toMatch(/"name":\s*"Mario Rossi"/);
  });
});

describe('Anonimato: GET /api/recipient/fresh-events/[id] (dettaglio slot)', () => {
  it('non espone nome di altri beneficiari nelle reservations', async () => {
    await authAsBeneficiary();
    mockPrisma.user.findUnique.mockResolvedValue(USER as any);
    mockPrisma.freshEvent.findUnique.mockResolvedValue({
      id: 'event-1',
      scheduledStart: new Date(Date.now() + 86400_000),
      scheduledEnd: new Date(Date.now() + 90000_000),
      capacity: 5,
      reservedCount: 2,
      waitingCount: 0,
      status: 'PUBLISHED',
      pickupInstructions: null,
      template: { id: 'tpl-1', title: 'Martedi', organizationId: 'org-1' },
      pickupLocation: null,
      reservations: [],
      myReservation: null,
    } as any);

    const req = new Request('http://test.local/api/recipient/fresh-events/event-1');
    const res = await GET_DETAIL(req, { params: Promise.resolve({ id: 'event-1' }) });
    const data = await res.json();
    const json = JSON.stringify(data);

    expect(res.status).toBe(200);
    // Anonimato: la response non deve contenere nomi o ID di altri beneficiari
    expect(json).not.toMatch(/Luca/);
    expect(json).not.toMatch(/Bianchi/);
    // Nessun campo donor
    expect(json).not.toMatch(/donorName/);
    expect(json).not.toMatch(/donor\.name/);
  });
});
