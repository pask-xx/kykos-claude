/**
 * Test integrazione: POST /api/operator/fresh-events/slots/[id]/scan-pickup
 *
 * Casi:
 * - scan QR valido CONFIRMED → PICKED_UP
 * - scan QR valido ADMITTED → PICKED_UP
 * - QR non valido (formato sbagliato) → 400
 * - QR già usato (PICKED_UP) → 400
 * - QR di reservation in WAITING (no qrCode) → scan rifiutato
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
  parseQrCodeData: vi.fn((d: string) => {
    const m = d.match(/^kykos:(fresh):(pickup):(.+):(.+)$/);
    if (!m) return null;
    return { type: m[2] as 'pickup', subType: m[1] as 'fresh', requestId: m[3], userId: m[4] };
  }),
}));

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { POST } from '@/app/api/operator/fresh-events/slots/[id]/scan-pickup/route';
import { mockPrisma, resetAllMocks } from '../../setup/mocks';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);

const OPERATOR = { id: 'op-1', active: true, role: 'ADMIN', permissions: [], organizationId: 'org-1' };

async function authAsAdmin() {
  mockCookies.mockImplementation(async () => ({
    get: (name: string) => (name === 'operator_session' ? { value: 'valid' } : undefined),
  }) as any);
  mockJwtVerify.mockImplementation(async () => ({
    payload: { operatorId: 'op-1', organizationId: 'org-1', username: 'admin', role: 'ADMIN' },
  }) as any);
}

function makeRequest(slotId: string, qrCode: string) {
  return new Request(`http://test.local/api/operator/fresh-events/slots/${slotId}/scan-pickup`, {
    method: 'POST',
    body: JSON.stringify({ qrCode }),
  });
}

function paramsOf(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

function setupPrisma(opts: { reservationStatus: 'CONFIRMED' | 'ADMITTED' | 'PICKED_UP' | 'WAITING' | 'CANCELLED'; beneficiaryId?: string }) {
  mockPrisma.operator.findUnique.mockResolvedValue(OPERATOR as any);
  mockPrisma.freshEventReservation.findUnique.mockResolvedValue({
    id: 'res-1',
    status: opts.reservationStatus,
    qrCode: opts.reservationStatus === 'WAITING' || opts.reservationStatus === 'CANCELLED' ? null : 'kykos:fresh:pickup:res-1:user-1',
    beneficiaryId: opts.beneficiaryId ?? 'user-1',
    freshEventId: 'slot-1',
    beneficiary: { id: opts.beneficiaryId ?? 'user-1', firstName: 'Mario', lastName: 'Rossi' },
  } as any);
  mockPrisma.freshEventReservation.updateMany.mockImplementation(async (args: any) => {
    if (args?.where?.status?.in?.includes(opts.reservationStatus)) {
      return { count: 1 };
    }
    return { count: 0 };
  });
  mockPrisma.freshEventReservation.update.mockResolvedValue({} as any);
}

beforeEach(() => {
  resetAllMocks();
  vi.clearAllMocks();
});

describe('POST /api/operator/fresh-events/slots/[id]/scan-pickup', () => {
  it('scan QR valido CONFIRMED → PICKED_UP', async () => {
    await authAsAdmin();
    setupPrisma({ reservationStatus: 'CONFIRMED' });

    const res = await POST(
      makeRequest('slot-1', 'kykos:fresh:pickup:res-1:user-1'),
      paramsOf('slot-1'),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.beneficiary.name).toContain('Mario');
  });

  it('scan QR valido ADMITTED → PICKED_UP', async () => {
    await authAsAdmin();
    setupPrisma({ reservationStatus: 'ADMITTED' });

    const res = await POST(
      makeRequest('slot-1', 'kykos:fresh:pickup:res-1:user-1'),
      paramsOf('slot-1'),
    );
    expect(res.status).toBe(200);
  });

  it('QR già usato (PICKED_UP) → 400', async () => {
    await authAsAdmin();
    setupPrisma({ reservationStatus: 'PICKED_UP' });

    const res = await POST(
      makeRequest('slot-1', 'kykos:fresh:pickup:res-1:user-1'),
      paramsOf('slot-1'),
    );
    expect(res.status).toBe(400);
  });

  it('QR di reservation in WAITING → scan rifiutato', async () => {
    await authAsAdmin();
    setupPrisma({ reservationStatus: 'WAITING' });

    const res = await POST(
      makeRequest('slot-1', 'kykos:fresh:pickup:res-1:user-1'),
      paramsOf('slot-1'),
    );
    expect(res.status).toBe(400);
  });

  it('reservation CANCELLED → scan rifiutato', async () => {
    await authAsAdmin();
    setupPrisma({ reservationStatus: 'CANCELLED' });

    const res = await POST(
      makeRequest('slot-1', 'kykos:fresh:pickup:res-1:user-1'),
      paramsOf('slot-1'),
    );
    expect(res.status).toBe(400);
  });
});
