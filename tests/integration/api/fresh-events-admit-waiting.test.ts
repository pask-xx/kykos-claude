/**
 * Test integrazione: POST /api/operator/fresh-events/slots/[id]/admit
 *
 * Casi:
 * - operatore ammette 1 beneficiario da waiting → ADMITTED + QR
 * - operatore ammette 3 beneficiari insieme → tutti ADMITTED
 * - operatore ammette più dei posti liberi → errore 400
 * - beneficiario non in WAITING → non ammesso
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
vi.mock('@/lib/qrcode', () => ({
  generateFreshPickupQrCode: vi.fn((rid: string, bid: string) => `kykos:fresh:pickup:${rid}:${bid}`),
  generateAndUploadQrCodeWithLogo: vi.fn().mockResolvedValue('https://test/qr.png'),
}));

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { POST } from '@/app/api/operator/fresh-events/slots/[id]/admit/route';
import { mockPrisma, resetAllMocks } from '../../setup/mocks';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);

const OPERATOR = { id: 'op-1', active: true, role: 'ADMIN', permissions: [], organizationId: 'org-1' };

const SLOT = {
  id: 'slot-1',
  capacity: 3,
  reservedCount: 3, // pieno
  waitingCount: 2,
  status: 'PUBLISHED',
  organizationId: 'org-1',
};

async function authAsAdmin() {
  mockCookies.mockImplementation(async () => ({
    get: (name: string) => (name === 'operator_session' ? { value: 'valid' } : undefined),
  }) as any);
  mockJwtVerify.mockImplementation(async () => ({
    payload: { operatorId: 'op-1', organizationId: 'org-1', username: 'admin', role: 'ADMIN' },
  }) as any);
}

function makeRequest(slotId: string, reservationIds: string[]) {
  return new Request(`http://test.local/api/operator/fresh-events/slots/${slotId}/admit`, {
    method: 'POST',
    body: JSON.stringify({ reservationIds }),
  });
}

function paramsOf(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

function setupPrisma(opts: { freeSlots: number; reservations?: { id: string; status: string }[] }) {
  mockPrisma.operator.findUnique.mockResolvedValue(OPERATOR as any);
  // Slot: reservedCount = capacity - freeSlots
  const reservedCount = SLOT.capacity - opts.freeSlots;
  mockPrisma.freshEvent.findUnique.mockResolvedValue({
    ...SLOT,
    reservedCount,
    template: { id: 'tpl-1', title: 'Martedi', organizationId: 'org-1' },
  } as any);
  // updateMany simula capacità: ritorna count solo se ci sono posti
  mockPrisma.freshEvent.updateMany.mockImplementation(async (args: any) => {
    if (opts.freeSlots > 0) {
      return { count: 1 };
    }
    return { count: 0 };
  });
  mockPrisma.freshEventReservation.findMany.mockResolvedValue(
    (opts.reservations ?? [{ id: 'res-1', status: 'WAITING' }]) as any,
  );
  mockPrisma.freshEventReservation.updateMany.mockImplementation(async (args: any) => {
    if (args?.where?.status === 'WAITING') {
      return { count: 1 };
    }
    return { count: 0 };
  });
  mockPrisma.freshEventReservation.findUnique.mockImplementation(async (args: any) => ({
    id: args?.where?.id ?? 'res-1',
    status: 'WAITING',
    beneficiaryId: 'user-1',
    beneficiary: { id: 'user-1', firstName: 'Mario', lastName: 'Rossi', email: 'm@test.it' },
  }));
  mockPrisma.freshEventReservation.update.mockImplementation(async (args: any) => ({
    id: args?.where?.id ?? 'res-1',
    status: 'ADMITTED',
    qrCode: `kykos:fresh:pickup:${args?.where?.id ?? 'res-1'}:user-1`,
    admittedAt: new Date(),
  }));
  mockPrisma.freshEvent.update.mockResolvedValue({} as any);
  mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', firstName: 'Mario', lastName: 'Rossi', email: 'm@test.it' } as any);
  mockPrisma.notification.create.mockResolvedValue({} as any);
  mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
}

beforeEach(() => {
  resetAllMocks();
  vi.clearAllMocks();
});

describe('POST /api/operator/fresh-events/slots/[id]/admit', () => {
  it('operatore ammette 1 beneficiario da waiting → ADMITTED', async () => {
    await authAsAdmin();
    setupPrisma({ freeSlots: 1, reservations: [{ id: 'res-1', status: 'WAITING' }] });

    const res = await POST(makeRequest('slot-1', ['res-1']), paramsOf('slot-1'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.admitted).toHaveLength(1);
  });

  it('operatore ammette 3 beneficiari insieme → tutti ADMITTED', async () => {
    await authAsAdmin();
    setupPrisma({
      freeSlots: 3,
      reservations: [
        { id: 'res-1', status: 'WAITING' },
        { id: 'res-2', status: 'WAITING' },
        { id: 'res-3', status: 'WAITING' },
      ],
    });

    const res = await POST(makeRequest('slot-1', ['res-1', 'res-2', 'res-3']), paramsOf('slot-1'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.admitted).toHaveLength(3);
  });

  it('slot pieno (no posti liberi) → 400', async () => {
    await authAsAdmin();
    setupPrisma({ freeSlots: 0, reservations: [{ id: 'res-1', status: 'WAITING' }] });

    const res = await POST(makeRequest('slot-1', ['res-1']), paramsOf('slot-1'));
    expect(res.status).toBe(400);
  });

  it('reservation non in WAITING → non ammessa', async () => {
    await authAsAdmin();
    setupPrisma({ freeSlots: 2, reservations: [{ id: 'res-1', status: 'WAITING' }] });
    // updateMany con status filter non ritorna match
    mockPrisma.freshEventReservation.updateMany.mockResolvedValue({ count: 0 });

    const res = await POST(makeRequest('slot-1', ['res-1']), paramsOf('slot-1'));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.admitted).toHaveLength(0);
  });
});
