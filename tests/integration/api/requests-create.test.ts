import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('jose', () => ({ jwtVerify: vi.fn() }));

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { POST } from '@/app/api/requests/route';
import { mockPrisma, resetAllMocks } from '../../setup/mocks';
import { sendRequestNotification, sendDeliveryQrNotification } from '@/lib/email';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);
const mockSendRequest = vi.mocked(sendRequestNotification);
const mockSendDeliveryQr = vi.mocked(sendDeliveryQrNotification);

const RECIPIENT_ID = 'r-1';
const OBJECT_ID = 'obj-1';
const INTERMEDIARY_ID = 'i-1';
const DONOR_ID = 'd-1';

function buildRequest(objectId: string, message?: string) {
  return new Request('http://localhost/api/requests', {
    method: 'POST',
    body: JSON.stringify(message !== undefined ? { objectId, message } : { objectId }),
    headers: { 'Content-Type': 'application/json' },
  });
}

async function authAsAuthorizedRecipient() {
  mockCookies.mockImplementation(async () => ({
    get: (name: string) => (name === 'session' ? { value: 'valid' } : undefined),
    delete: () => undefined,
  }) as any);
  mockJwtVerify.mockImplementation(async () => ({
    payload: { user: { id: RECIPIENT_ID, email: 'r@test.it', name: 'Recipient', role: 'RECIPIENT' } },
  }) as any);
  // user.findUnique for authorization check (id + authorized)
  mockPrisma.user.findUnique.mockImplementation(async (args: any) => {
    if (args?.where?.id === RECIPIENT_ID) {
      return { authorized: true };
    }
    return null;
  });
}

function setupAvailableObject(opts: { autoApprove?: boolean; objectId?: string } = {}) {
  const oid = opts.objectId ?? OBJECT_ID;
  mockPrisma.object.findUnique.mockImplementation(async (args: any) => {
    if (args?.where?.id === oid) {
      return {
        id: oid,
        title: 'Sedia',
        status: 'AVAILABLE',
        donorId: DONOR_ID,
        intermediaryId: INTERMEDIARY_ID,
        intermediary: {
          id: INTERMEDIARY_ID,
          name: 'Caritas',
          autoApproveRequests: opts.autoApprove ?? false,
          address: 'Via Roma',
          houseNumber: '1',
          cap: '00100',
          city: 'Roma',
          province: 'RM',
          phone: '0612345678',
          email: 'info@caritas.it',
          hoursInfo: '9-12',
        },
      };
    }
    return null;
  });
}

beforeEach(() => {
  resetAllMocks();
  mockCookies.mockReset();
  mockJwtVerify.mockReset();
  mockSendRequest.mockClear();
  mockSendDeliveryQr.mockClear();

  // Default: no existing request
  mockPrisma.request.findFirst.mockImplementation(async () => null);
});

describe('POST /api/requests — B3 (TOCTOU race fix)', () => {
  it('happy path: auto-approve creates APPROVED request + donation + RESERVED object + sends QR', async () => {
    await authAsAuthorizedRecipient();
    setupAvailableObject({ autoApprove: true });

    // updateMany succeeds (object is still AVAILABLE)
    mockPrisma.object.updateMany.mockImplementation(async () => ({ count: 1 }));
    // request.create returns the created record
    mockPrisma.request.create.mockImplementation(async (args: any) => ({
      id: 'req-1',
      objectId: args.data.objectId,
      recipientId: args.data.recipientId,
      intermediaryId: args.data.intermediaryId,
      message: args.data.message,
      status: args.data.status,
      object: {
        id: OBJECT_ID,
        title: 'Sedia',
        donorId: DONOR_ID,
        donor: { id: DONOR_ID, name: 'Donor', email: 'd@test.it' },
      },
    }));
    mockPrisma.donation.create.mockImplementation(async (args: any) => ({ id: 'don-1', ...args.data }));

    const response = await POST(buildRequest(OBJECT_ID, 'Per favore'));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.request.status).toBe('APPROVED');
    expect(body.autoApproved).toBe(true);

    // Reservation was atomic (updateMany with conditional WHERE)
    expect(mockPrisma.object.updateMany).toHaveBeenCalledWith({
      where: { id: OBJECT_ID, status: 'AVAILABLE' },
      data: { status: 'RESERVED' },
    });

    // Donation created in the same tx
    expect(mockPrisma.donation.create).toHaveBeenCalledTimes(1);
    const donationArgs = mockPrisma.donation.create.mock.calls[0][0];
    expect(donationArgs.data.objectId).toBe(OBJECT_ID);
    expect(donationArgs.data.requestId).toBe('req-1');

    // QR + email sent to donor
    expect(mockSendDeliveryQr).toHaveBeenCalledTimes(1);
    expect(mockSendRequest).not.toHaveBeenCalled();
  });

  it('happy path: no auto-approve creates PENDING request, object stays AVAILABLE, donor gets email (NOT QR)', async () => {
    await authAsAuthorizedRecipient();
    setupAvailableObject({ autoApprove: false });

    mockPrisma.request.create.mockImplementation(async (args: any) => ({
      id: 'req-1',
      objectId: args.data.objectId,
      recipientId: args.data.recipientId,
      intermediaryId: args.data.intermediaryId,
      message: args.data.message,
      status: args.data.status,
      object: {
        id: OBJECT_ID,
        title: 'Sedia',
        donorId: DONOR_ID,
        donor: { id: DONOR_ID, name: 'Donor', email: 'd@test.it' },
      },
    }));

    const response = await POST(buildRequest(OBJECT_ID));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.request.status).toBe('PENDING');
    expect(body.autoApproved).toBe(false);

    // No updateMany (no reservation) for PENDING path
    expect(mockPrisma.object.updateMany).not.toHaveBeenCalled();
    // No donation created
    expect(mockPrisma.donation.create).not.toHaveBeenCalled();

    // PENDING email to donor, NO delivery QR
    expect(mockSendRequest).toHaveBeenCalledTimes(1);
    expect(mockSendRequest.mock.calls[0][0]).toBe('d@test.it'); // donor email
    expect(mockSendDeliveryQr).not.toHaveBeenCalled();
  });

  it('B3: race lost — updateMany returns count=0 because object is no longer AVAILABLE → 409, no orphan donation, no request', async () => {
    await authAsAuthorizedRecipient();
    setupAvailableObject({ autoApprove: true });

    // Simulate the race: between our pre-check and our updateMany,
    // another recipient reserved the object. updateMany sees status=RESERVED, count=0.
    mockPrisma.object.updateMany.mockImplementation(async () => ({ count: 0 }));

    const response = await POST(buildRequest(OBJECT_ID));

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toMatch(/riservato da un altro ricevente/);

    // No request was created, no donation was created
    expect(mockPrisma.request.create).not.toHaveBeenCalled();
    expect(mockPrisma.donation.create).not.toHaveBeenCalled();

    // No notification or QR was sent
    expect(mockSendDeliveryQr).not.toHaveBeenCalled();
    expect(mockSendRequest).not.toHaveBeenCalled();
  });

  it('returns 401 when no session is present', async () => {
    mockCookies.mockImplementation(async () => ({
      get: () => undefined,
      delete: () => undefined,
    }) as any);

    const response = await POST(buildRequest(OBJECT_ID));
    expect(response.status).toBe(401);

    // No DB calls at all
    expect(mockPrisma.object.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.request.create).not.toHaveBeenCalled();
  });

  it('returns 403 when user is not a RECIPIENT', async () => {
    mockCookies.mockImplementation(async () => ({
      get: (name: string) => (name === 'session' ? { value: 'valid' } : undefined),
      delete: () => undefined,
    }) as any);
    mockJwtVerify.mockImplementation(async () => ({
      payload: { user: { id: 'd-1', email: 'd@test.it', name: 'Donor', role: 'DONOR' } },
    }) as any);

    const response = await POST(buildRequest(OBJECT_ID));
    expect(response.status).toBe(403);

    expect(mockPrisma.object.findUnique).not.toHaveBeenCalled();
  });

  it('returns 403 when recipient is not authorized', async () => {
    await authAsAuthorizedRecipient();
    // Override the user lookup to return authorized=false
    mockPrisma.user.findUnique.mockImplementation(async (args: any) => {
      if (args?.where?.id === RECIPIENT_ID) {
        return { authorized: false };
      }
      return null;
    });

    const response = await POST(buildRequest(OBJECT_ID));
    expect(response.status).toBe(403);

    expect(mockPrisma.object.findUnique).not.toHaveBeenCalled();
  });

  it('returns 400 when objectId is missing', async () => {
    await authAsAuthorizedRecipient();

    const req = new Request('http://localhost/api/requests', {
      method: 'POST',
      body: JSON.stringify({ message: 'no id' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
    expect(mockPrisma.object.findUnique).not.toHaveBeenCalled();
  });

  it('returns 404 when object does not exist', async () => {
    await authAsAuthorizedRecipient();
    mockPrisma.object.findUnique.mockImplementation(async () => null);

    const response = await POST(buildRequest('nonexistent'));
    expect(response.status).toBe(404);
  });

  it('returns 400 when object is not AVAILABLE (PENDING, RESERVED, etc.)', async () => {
    await authAsAuthorizedRecipient();
    mockPrisma.object.findUnique.mockImplementation(async () => ({
      id: OBJECT_ID,
      title: 'Sedia',
      status: 'RESERVED',
      donorId: DONOR_ID,
      intermediaryId: INTERMEDIARY_ID,
      intermediary: { id: INTERMEDIARY_ID, name: 'Caritas', autoApproveRequests: true },
    }) as any);

    const response = await POST(buildRequest(OBJECT_ID));
    expect(response.status).toBe(400);

    // No updateMany / no create — fails before tx
    expect(mockPrisma.object.updateMany).not.toHaveBeenCalled();
    expect(mockPrisma.request.create).not.toHaveBeenCalled();
  });

  it('returns 400 when recipient already requested this object (idempotency)', async () => {
    await authAsAuthorizedRecipient();
    setupAvailableObject({ autoApprove: true });

    // existingRequest is found
    mockPrisma.request.findFirst.mockImplementation(async () => ({
      id: 'existing-req',
      objectId: OBJECT_ID,
      recipientId: RECIPIENT_ID,
      status: 'PENDING',
    }));

    const response = await POST(buildRequest(OBJECT_ID));
    expect(response.status).toBe(400);

    // No new request, no reservation
    expect(mockPrisma.request.create).not.toHaveBeenCalled();
    expect(mockPrisma.object.updateMany).not.toHaveBeenCalled();
  });
});
