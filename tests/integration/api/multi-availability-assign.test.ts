import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('jose', () => ({ jwtVerify: vi.fn() }));

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { POST } from '@/app/api/operator/multi-availability/[id]/assign/route';
import { mockPrisma, resetAllMocks } from '../../setup/mocks';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);

const AVAILABILITY = {
  id: 'avail-1',
  title: 'Borse spesa natalizie',
  organizationId: 'org-1',
  availableQty: 5,
  assignedQty: 0,
};

const ORG = {
  name: 'Caritas Roma',
  address: 'Via Roma',
  houseNumber: '1',
  cap: '00100',
  city: 'Roma',
  province: 'RM',
  phone: '0612345678',
  email: 'info@caritas.it',
  hoursInfo: '9-18',
};

const OPERATOR = {
  id: 'op-1',
  active: true,
  role: 'ADMIN',
  permissions: [] as string[],
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

function makeRequest(requestIds: string[]) {
  return new Request('http://test.local/api/operator/multi-availability/avail-1/assign', {
    method: 'POST',
    body: JSON.stringify({ requestIds }),
  });
}

function paramsOf(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

// Mock Prisma helpers --------------------------------------------------------------

/**
 * Sets up the prisma mock with a working assign flow:
 * - operator exists, active, with ADMIN role
 * - availability exists, organizationId matches
 * - requestIds map to requests currently in PENDING status
 *
 * Returns a small state object that the test can mutate between calls to
 * simulate race conditions (e.g. another operator took the slot first).
 */
function setupPrisma(opts: {
  requestStatuses: Record<string, 'PENDING' | 'ASSIGNED' | 'FULFILLED'>;
  availability?: Partial<typeof AVAILABILITY>;
  operator?: Partial<typeof OPERATOR>;
}) {
  mockPrisma.operator.findUnique.mockImplementation(async () => ({
    ...OPERATOR,
    ...(opts.operator ?? {}),
  }) as any);
  mockPrisma.multiAvailability.findUnique.mockImplementation(async () => ({
    ...AVAILABILITY,
    ...opts.availability,
  }) as any);

  // findMany of multiAvailabilityRequest returns the requests for
  // requestIds, with their current status.
  mockPrisma.multiAvailabilityRequest.findMany.mockImplementation(async (args: any) => {
    const ids: string[] = args.where.id.in;
    return ids.map((id) => ({
      id,
      beneficiaryId: `ben-${id}`,
      status: opts.requestStatuses[id] ?? 'PENDING',
    }));
  });

  // findUnique of a single request: used after the transaction to know
  // if the transaction actually transitioned it to ASSIGNED.
  mockPrisma.multiAvailabilityRequest.findUnique.mockImplementation(async (args: any) => {
    return {
      id: args.where.id,
      status: opts.requestStatuses[args.where.id] ?? 'PENDING',
    };
  });

  // updateMany of multiAvailabilityRequest: ATOMIC check.
  // If the request is currently PENDING, the count is 1 and we flip to ASSIGNED.
  // If it's already ASSIGNED, the count is 0 (race lost).
  mockPrisma.multiAvailabilityRequest.updateMany.mockImplementation(async (args: any) => {
    const id = args.where.id;
    const current = opts.requestStatuses[id];
    if (current === 'PENDING' && args.where.status === 'PENDING') {
      opts.requestStatuses[id] = 'ASSIGNED';
      return { count: 1 };
    }
    return { count: 0 };
  });

  // update of multiAvailabilityRequest (for QR + needScoreSnapshot)
  mockPrisma.multiAvailabilityRequest.update.mockImplementation(async () => ({ id: 'updated' }) as any);

  // update of multiAvailability (for assignedQty increment)
  mockPrisma.multiAvailability.update.mockImplementation(async (args: any) => {
    if (args.data.assignedQty?.increment != null) {
      AVAILABILITY.assignedQty += args.data.assignedQty.increment;
    }
    return { ...AVAILABILITY };
  });

  // user.findMany for beneficiaries (used to build the email recipient map)
  mockPrisma.user.findMany.mockImplementation(async () => [
    { id: 'ben-r-1', email: 'b1@t.it', firstName: 'Mario', lastName: 'Rossi', name: 'Mario Rossi', nickname: null, needScore: 60 },
    { id: 'ben-r-2', email: 'b2@t.it', firstName: 'Anna', lastName: 'Bianchi', name: 'Anna B.', nickname: null, needScore: 70 },
    { id: 'ben-r-3', email: 'b3@t.it', firstName: 'Luca', lastName: 'Verdi', name: 'Luca V.', nickname: null, needScore: 80 },
  ] as any);

  mockPrisma.organization.findUnique.mockImplementation(async () => ORG as any);
  mockPrisma.notification.create.mockImplementation(async () => ({ id: 'notif-1' } as any));
}

beforeEach(() => {
  resetAllMocks();
  mockCookies.mockReset();
  mockJwtVerify.mockReset();
  // reset availability counters
  AVAILABILITY.availableQty = 5;
  AVAILABILITY.assignedQty = 0;
});

// ----------------------------------------------------------------------------
// Test cases
// ----------------------------------------------------------------------------

describe('POST /api/operator/multi-availability/[id]/assign — B1 (race-safe)', () => {
  it('assigns all PENDING requests when capacity is sufficient', async () => {
    await authAsAdmin();
    setupPrisma({
      requestStatuses: { 'r-1': 'PENDING', 'r-2': 'PENDING', 'r-3': 'PENDING' },
    });

    const response = await POST(makeRequest(['r-1', 'r-2', 'r-3']), paramsOf('avail-1'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.assigned).toBe(3);
    expect(body.qrCodes).toHaveLength(3);
    expect(AVAILABILITY.assignedQty).toBe(3);
  });

  it('returns 400 and does NOT change any state when capacity is exceeded', async () => {
    await authAsAdmin();
    setupPrisma({
      requestStatuses: { 'r-1': 'PENDING', 'r-2': 'PENDING', 'r-3': 'PENDING' },
      availability: { availableQty: 1 },
    });

    const response = await POST(makeRequest(['r-1', 'r-2', 'r-3']), paramsOf('avail-1'));
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toMatch(/Superata la quantità disponibile/);
    expect(body.error).toMatch(/1/); // 1 slot era libero

    // Nessuna riga deve essere passata a ASSIGNED (rollback della transaction)
    // e assignedQty non deve essere incrementato.
    expect(AVAILABILITY.assignedQty).toBe(0);
  });

  it('skips requests that are no longer PENDING (lost a concurrent race)', async () => {
    await authAsAdmin();
    // r-1 è già stato preso da un altro operatore (race vinta)
    setupPrisma({
      requestStatuses: { 'r-1': 'ASSIGNED', 'r-2': 'PENDING', 'r-3': 'PENDING' },
    });

    const response = await POST(makeRequest(['r-1', 'r-2', 'r-3']), paramsOf('avail-1'));
    expect(response.status).toBe(200);

    const body = await response.json();
    // r-1 era già ASSIGNED, quindi il count tornato da updateMany per r-1 è 0.
    // r-2 e r-3 sono stati correttamente portati a ASSIGNED.
    expect(body.assigned).toBe(2);
    expect(body.qrCodes).toHaveLength(2);
    expect(AVAILABILITY.assignedQty).toBe(2);
  });

  it('returns 401 when no session is present', async () => {
    mockCookies.mockImplementation(async () => ({ get: () => undefined }) as any);
    const response = await POST(makeRequest(['r-1']), paramsOf('avail-1'));
    expect(response.status).toBe(401);
  });

  it('returns 403 when the operator does not have ORGANIZATION_ADMIN permission', async () => {
    await authAsAdmin();
    setupPrisma({
      requestStatuses: { 'r-1': 'PENDING' },
      operator: { role: 'GESTORE_VOLONTARI', permissions: [] },
    });

    const response = await POST(makeRequest(['r-1']), paramsOf('avail-1'));
    expect(response.status).toBe(403);
    // Nessuna mutazione deve essere partita
    expect(AVAILABILITY.assignedQty).toBe(0);
  });

  it('returns 403 when the availability belongs to another organization', async () => {
    await authAsAdmin();
    mockPrisma.multiAvailability.findUnique.mockImplementation(async () => ({
      ...AVAILABILITY,
      organizationId: 'org-OTHER',
    }) as any);

    const response = await POST(makeRequest(['r-1']), paramsOf('avail-1'));
    expect(response.status).toBe(403);
  });

  it('deduplicates requestIds so the same id is not over-assigned', async () => {
    await authAsAdmin();
    setupPrisma({ requestStatuses: { 'r-1': 'PENDING' } });

    const response = await POST(makeRequest(['r-1', 'r-1', 'r-1']), paramsOf('avail-1'));
    expect(response.status).toBe(200);

    const body = await response.json();
    // r-1 transita una sola volta a ASSIGNED anche se è ripetuto 3 volte
    expect(body.assigned).toBe(1);
    expect(AVAILABILITY.assignedQty).toBe(1);
  });

  it('returns 400 when requestIds is not an array', async () => {
    await authAsAdmin();
    setupPrisma({ requestStatuses: {} });

    const req = new Request('http://test.local/api/operator/multi-availability/avail-1/assign', {
      method: 'POST',
      body: JSON.stringify({ requestIds: 'not-an-array' }),
    });
    const response = await POST(req, paramsOf('avail-1'));
    expect(response.status).toBe(400);
  });

  it('returns 200 with assigned=0 when no request was PENDING anymore (all races lost)', async () => {
    await authAsAdmin();
    setupPrisma({
      requestStatuses: { 'r-1': 'ASSIGNED', 'r-2': 'FULFILLED', 'r-3': 'CANCELLED' as any },
    });

    const response = await POST(makeRequest(['r-1', 'r-2', 'r-3']), paramsOf('avail-1'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.assigned).toBe(0);
    expect(body.qrCodes).toHaveLength(0);
    expect(AVAILABILITY.assignedQty).toBe(0);
  });

  it('sends one notification per successfully-assigned beneficiary', async () => {
    await authAsAdmin();
    setupPrisma({ requestStatuses: { 'r-1': 'PENDING', 'r-2': 'PENDING' } });

    await POST(makeRequest(['r-1', 'r-2']), paramsOf('avail-1'));
    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2);
  });
});
