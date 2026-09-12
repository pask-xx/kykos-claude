/**
 * Test integrazione: POST /api/operator/fresh-events/reservation/[id]/no-show
 *
 * Casi:
 * - primo no-show: freshWarnings=1, no sospensione
 * - secondo no-show con soglia=2: freshWarnings=2, sospensione 30gg
 * - terzo no-show dopo fine sospensione: warnings=3, ri-sospensione
 * - beneficiario già sospeso non viene ri-sospeso se i warning non raggiungono soglia
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
import { POST } from '@/app/api/operator/fresh-events/reservation/[id]/no-show/route';
import { mockPrisma, resetAllMocks } from '../../setup/mocks';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);

const OPERATOR = {
  id: 'op-1',
  active: true,
  role: 'ADMIN',
  permissions: ['ORGANIZATION_ADMIN'],
  organizationId: 'org-1',
};

const ORG = {
  id: 'org-1',
  name: 'Caritas Roma',
  freshWarningThreshold: 2,
  freshSuspensionDays: 30,
};

const BENEFICIARY: any = {
  id: 'user-1',
  firstName: 'Mario',
  lastName: 'Rossi',
  email: 'mario@test.it',
  freshWarnings: 0,
  freshSuspendedUntil: null as Date | null,
};

const RESERVATION = {
  id: 'res-1',
  status: 'CONFIRMED',
  qrCode: 'kykos:fresh:pickup:res-1:user-1',
  freshEventId: 'event-1',
  beneficiaryId: 'user-1',
  beneficiary: BENEFICIARY,
  freshEvent: {
    id: 'event-1',
    capacity: 3,
    reservedCount: 1,
    scheduledStart: new Date(Date.now() + 86400_000),
    scheduledEnd: new Date(Date.now() + 90000_000),
    template: { id: 'tpl-1', title: 'Martedi', organizationId: 'org-1' },
  },
};

async function authAsAdmin() {
  mockCookies.mockImplementation(async () => ({
    get: (name: string) => (name === 'operator_session' ? { value: 'valid' } : undefined),
  }) as any);
  mockJwtVerify.mockImplementation(async () => ({
    payload: { operatorId: 'op-1', organizationId: 'org-1', username: 'admin', role: 'ADMIN' },
  }) as any);
}

function makeRequest(reservationId: string) {
  return new Request(`http://test.local/api/operator/fresh-events/reservation/${reservationId}/no-show`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

function paramsOf(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

function setupPrisma(opts: {
  beneficiary?: Partial<typeof BENEFICIARY>;
  org?: Partial<typeof ORG>;
  reservation?: Partial<typeof RESERVATION>;
}) {
  const beneficiary = { ...BENEFICIARY, ...(opts.beneficiary ?? {}) };
  const org = { ...ORG, ...(opts.org ?? {}) };
  const reservation = {
    ...RESERVATION,
    ...(opts.reservation ?? {}),
    beneficiary,
    freshEvent: { ...RESERVATION.freshEvent, template: { ...RESERVATION.freshEvent.template, organizationId: org.id } },
  };

  mockPrisma.operator.findUnique.mockResolvedValue(OPERATOR as any);
  mockPrisma.organization.findUnique.mockResolvedValue(org as any);
  mockPrisma.freshEventReservation.findUnique.mockResolvedValue(reservation as any);
  mockPrisma.freshEventReservation.update.mockResolvedValue({ ...reservation, status: 'NO_SHOW' } as any);
  mockPrisma.freshEvent.update.mockResolvedValue({} as any);
  mockPrisma.user.findUnique.mockImplementation(async () => beneficiary as any);
  mockPrisma.user.update.mockImplementation(async (args: any) => ({
    ...beneficiary,
    ...(args.data ?? {}),
  }));
  mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
  mockPrisma.notification.create.mockResolvedValue({} as any);
}

beforeEach(() => {
  resetAllMocks();
  vi.clearAllMocks();
});

describe('POST /api/operator/fresh-events/reservation/[id]/no-show', () => {
  it('primo no-show: warnings=1, no sospensione', async () => {
    await authAsAdmin();
    setupPrisma({ beneficiary: { freshWarnings: 0 } });

    const res = await POST(makeRequest('res-1'), paramsOf('res-1'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.warnings).toBe(1);
    expect(data.justSuspended).toBe(false);
  });

  it('secondo no-show con soglia=2: warnings=2, sospensione 30gg', async () => {
    await authAsAdmin();
    setupPrisma({ beneficiary: { freshWarnings: 1 } });

    const res = await POST(makeRequest('res-1'), paramsOf('res-1'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.warnings).toBe(2);
    expect(data.justSuspended).toBe(true);
    expect(data.suspendedUntil).toBeTruthy();
  });

  it('terzo no-show: warnings=3, sempre sospeso se oltre soglia', async () => {
    await authAsAdmin();
    setupPrisma({
      beneficiary: {
        freshWarnings: 2,
        freshSuspendedUntil: new Date(Date.now() - 86400_000 * 40), // sospensione scaduta da 40gg
      },
    });

    const res = await POST(makeRequest('res-1'), paramsOf('res-1'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.warnings).toBe(3);
    // Se warnings >= threshold, ri-sospende
    expect(data.justSuspended).toBe(true);
  });

  it('reservation non trovata → 404', async () => {
    await authAsAdmin();
    mockPrisma.operator.findUnique.mockResolvedValue(OPERATOR as any);
    mockPrisma.freshEventReservation.findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest('res-missing'), paramsOf('res-missing'));
    expect(res.status).toBe(404);
  });

  it('reservation non in stato CONFIRMED/ADMITTED → 400', async () => {
    await authAsAdmin();
    setupPrisma({ reservation: { status: 'CANCELLED' as any } });

    const res = await POST(makeRequest('res-1'), paramsOf('res-1'));
    expect(res.status).toBe(400);
  });
});
