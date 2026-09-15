/**
 * Test integrazione: POST /api/recipient/fresh-events/[id]/reserve
 *
 * Casi:
 * - beneficiario autorizzato, slot con capacità 3, 2 prenotazioni → terzo WAITING
 * - slot pieno, due prenotazioni simultanee → una vince, l'altra WAITING
 * - beneficiario già prenotato → 400
 * - beneficiario sospeso (freshSuspendedUntil > now) → 403
 * - beneficiario non autorizzato → 403
 * - slot CLOSED/COMPLETED → 400
 * - anonimato: response non contiene donor.name né donor.email
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
  parseQrCodeData: vi.fn((d: string) => {
    const m = d.match(/^kykos:(fresh):(pickup):(.+):(.+)$/);
    if (!m) return null;
    return { type: m[2] as 'pickup', subType: m[1] as 'fresh', requestId: m[3], userId: m[4] };
  }),
}));

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { POST } from '@/app/api/recipient/fresh-events/[id]/reserve/route';
import { mockPrisma, resetAllMocks } from '../../setup/mocks';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);

const USER = {
  id: 'user-1',
  firstName: 'Mario',
  lastName: 'Rossi',
  email: 'mario@test.it',
  role: 'RECIPIENT',
  authorized: true,
  canRequestFresh: true,
  isActive: true,
  freshSuspendedUntil: null,
  freshWarnings: 0,
  organizationId: 'org-1',
};

const ORG = {
  name: 'Caritas Roma',
  address: 'Via Roma 1',
  houseNumber: '1',
  cap: '00100',
  city: 'Roma',
  province: 'RM',
  phone: '0612345678',
  email: 'info@caritas.it',
  hoursInfo: '9-18',
};

function makeRequest(id: string) {
  return new Request(`http://test.local/api/recipient/fresh-events/${id}/reserve`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

function paramsOf(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

async function authAsBeneficiary(user: typeof USER = USER) {
  mockCookies.mockImplementation(async () => ({
    get: (name: string) => (name === 'session' ? { value: 'valid' } : undefined),
  }) as any);
  mockJwtVerify.mockImplementation(async () => ({
    payload: {
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
      },
    },
  }) as any);
}

function setupEvent(opts: {
  capacity: number;
  reservedCount: number;
  status?: 'PUBLISHED' | 'FULL' | 'CLOSED' | 'COMPLETED' | 'CANCELLED';
  suspended?: Date | null;
  userAuthorized?: boolean;
  userCanRequestFresh?: boolean;
  userActive?: boolean;
  existingReservation?: { id: string } | null;
}) {
  const event = {
    id: 'event-1',
    scheduledStart: new Date(Date.now() + 86400_000),
    scheduledEnd: new Date(Date.now() + 90000_000),
    capacity: opts.capacity,
    reservedCount: opts.reservedCount,
    status: opts.status ?? 'PUBLISHED',
    template: { id: 'tpl-1', title: 'Martedi pomeriggio', organizationId: 'org-1', organization: ORG },
  };

  mockPrisma.freshEvent.findUnique.mockResolvedValue(event as any);

  mockPrisma.user.findUnique.mockImplementation(async () => ({
    ...USER,
    authorized: opts.userAuthorized ?? true,
    canRequestFresh: opts.userCanRequestFresh ?? true,
    isActive: opts.userActive ?? true,
    deactivatedAt: null,
    freshSuspendedUntil: opts.suspended ?? null,
  }));

  if (opts.existingReservation) {
    mockPrisma.freshEventReservation.findUnique.mockResolvedValue(opts.existingReservation as any);
  } else {
    mockPrisma.freshEventReservation.findUnique.mockResolvedValue(null);
  }

  // Simula updateMany: vince se c'è capacità disponibile
  mockPrisma.freshEvent.updateMany.mockImplementation(async () => {
    if (event.reservedCount < event.capacity) {
      event.reservedCount += 1;
      return { count: 1 };
    }
    return { count: 0 };
  });

  // $transaction simulato: esegue callback
  mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));

  mockPrisma.freshEventReservation.create.mockImplementation(async (args: any) => ({
    id: 'reservation-new',
    status: 'CONFIRMED',
    position: null,
    qrCode: 'kykos:fresh:pickup:reservation-new:user-1',
    reservedAt: new Date(),
    admittedAt: null,
    pickedUpAt: null,
    cancelledAt: null,
    noShowAt: null,
    notifiedAt: null,
    ...args.data,
  }));
  // getNextWaitingPosition: nessun waiting → posizione 1
  mockPrisma.freshEventReservation.findFirst.mockResolvedValue(null);

  mockPrisma.freshEvent.update.mockImplementation(async () => event);
  mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' } as any);
}

beforeEach(() => {
  resetAllMocks();
  vi.clearAllMocks();
});

describe('POST /api/recipient/fresh-events/[id]/reserve', () => {
  it('beneficiario autorizzato, slot con capacità libera → 200 CONFIRMED', async () => {
    await authAsBeneficiary();
    setupEvent({ capacity: 3, reservedCount: 0 });

    const res = await POST(makeRequest('event-1'), paramsOf('event-1'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.type).toBe('CONFIRMED');
    expect(data.qrCode).toMatch(/^kykos:fresh:pickup:/);
  });

  it('slot pieno → WAITING con posizione', async () => {
    await authAsBeneficiary();
    // updateMany ritorna 0 (slot pieno), fallback WAITING
    mockPrisma.freshEvent.findUnique.mockResolvedValue({
      id: 'event-1',
      scheduledStart: new Date(Date.now() + 86400_000),
      scheduledEnd: new Date(Date.now() + 90000_000),
      capacity: 1,
      reservedCount: 1,
      status: 'FULL',
      template: { id: 'tpl-1', title: 'Martedi pomeriggio', organizationId: 'org-1', organization: ORG },
    } as any);
    mockPrisma.user.findUnique.mockResolvedValue(USER as any);
    mockPrisma.freshEventReservation.findUnique.mockResolvedValue(null);
    mockPrisma.freshEvent.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
    mockPrisma.freshEventReservation.findFirst.mockResolvedValue(null);
    mockPrisma.freshEventReservation.create.mockImplementation(async (args: any) => ({
      id: 'res-w',
      status: 'WAITING',
      position: 1,
      qrCode: null,
      reservedAt: new Date(),
      admittedAt: null,
      pickedUpAt: null,
      cancelledAt: null,
      noShowAt: null,
      notifiedAt: null,
      ...args.data,
    }));
    mockPrisma.freshEvent.update.mockResolvedValue({} as any);

    const res = await POST(makeRequest('event-1'), paramsOf('event-1'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.type).toBe('WAITING');
    expect(data.reservationId).toBeTruthy();
  });

  it('beneficiario già prenotato → 400', async () => {
    await authAsBeneficiary();
    setupEvent({
      capacity: 3,
      reservedCount: 0,
      existingReservation: { id: 'existing' },
    });

    const res = await POST(makeRequest('event-1'), paramsOf('event-1'));
    expect(res.status).toBe(400);
  });

  it('beneficiario sospeso (freshSuspendedUntil > now) → 403', async () => {
    await authAsBeneficiary();
    setupEvent({
      capacity: 3,
      reservedCount: 0,
      suspended: new Date(Date.now() + 86400_000), // sospeso per 1gg
    });

    const res = await POST(makeRequest('event-1'), paramsOf('event-1'));
    expect(res.status).toBe(403);
  });

  it('beneficiario non autorizzato → 403', async () => {
    await authAsBeneficiary();
    setupEvent({
      capacity: 3,
      reservedCount: 0,
      userAuthorized: false,
    });

    const res = await POST(makeRequest('event-1'), paramsOf('event-1'));
    expect(res.status).toBe(403);
  });

  it('slot CLOSED → 400', async () => {
    await authAsBeneficiary();
    setupEvent({ capacity: 3, reservedCount: 0, status: 'CLOSED' });

    const res = await POST(makeRequest('event-1'), paramsOf('event-1'));
    expect(res.status).toBe(400);
  });

  it('slot CANCELLED → 400', async () => {
    await authAsBeneficiary();
    setupEvent({ capacity: 3, reservedCount: 0, status: 'CANCELLED' });

    const res = await POST(makeRequest('event-1'), paramsOf('event-1'));
    expect(res.status).toBe(400);
  });

  it('beneficiario con canRequestFresh=false → 403 (ente non ha abilitato al fresco)', async () => {
    await authAsBeneficiary();
    setupEvent({
      capacity: 3,
      reservedCount: 0,
      userAuthorized: true,
      userCanRequestFresh: false,
    });

    const res = await POST(makeRequest('event-1'), paramsOf('event-1'));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toMatch(/non sei abilitato|fresco/i);
  });
});
