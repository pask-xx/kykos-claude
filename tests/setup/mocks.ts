import { vi } from 'vitest';

// Mock Next.js cookie store (used by getSession, getOperatorSession, etc.)
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

// Mock Supabase client BEFORE any imports that use it
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { publicUrl: 'https://test.com/qr.png' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/qr.png' } }),
      }),
    },
  }),
}));

// Mock Prisma client with all models
export const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  goodsRequest: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  goodsOffer: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  organization: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  operator: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  notification: {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  request: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  object: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  donation: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
  multiAvailability: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  multiAvailabilityRequest: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  legalConsent: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
  legalDocumentVersion: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  adminAction: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
  /**
   * $transaction passthrough: executes the callback with the same mockPrisma
   * (so the callback can call tx.user.findUnique, etc., which are the same mocks).
   * For tests that need to assert on the transaction itself, use vi.mocked(prisma.$transaction).mockImplementationOnce.
   */
  $transaction: vi.fn().mockImplementation(async (cb: (tx: typeof mockPrisma) => unknown) => cb(mockPrisma)),
};

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

/**
 * Auth session mock helper.
 * Call this in beforeEach to set the desired session state.
 * - mockAuthSession(null)         -> no session
 * - mockAuthSession({ role: 'DONOR', ... }) -> user session
 * - mockAuthSession({ role: 'OPERATOR' }, 'operator') -> operator session
 */
export function mockAuthSession(
  user: Record<string, unknown> | null,
  kind: 'user' | 'operator' = 'user'
) {
  const payload = user ? { ...user } : null;
  const { jwtVerify } = require('jose') as { jwtVerify: ReturnType<typeof vi.fn> };
  if (payload) {
    // mockResolvedValueOnly: imposta solo il valore di successo (no implementation reset issues)
    jwtVerify.mockImplementation(async () => ({ payload }));
  } else {
    jwtVerify.mockImplementation(async () => { throw new Error('invalid token'); });
  }
  // Also clear the cookie store for completeness (no-op if not present)
  return { kind, payload };
}

// Re-export the jwtVerify mock so tests can interact with it directly
// (avoids the `require('jose')` returning an unmocked module in some test envs).
import { jwtVerify as _jwtVerify } from 'jose';
export const mockJwtVerify = vi.mocked(_jwtVerify);

// Mock jose JWT library
vi.mock('jose', () => {
  // Use a real class so `new SignJWT(...)` works
  class SignJWT {
    payload: unknown;
    constructor(payload: unknown) { this.payload = payload; }
    setProtectedHeader() { return this; }
    setIssuedAt() { return this; }
    setExpirationTime() { return this; }
    async sign() { return 'mock-token'; }
  }
  return {
    jwtVerify: vi.fn().mockResolvedValue({ payload: {} }),
    SignJWT,
  };
});

// Mock email functions to prevent actual emails
vi.mock('@/lib/email', () => ({
  sendGoodsDeliveryQrNotification: vi.fn().mockResolvedValue(true),
  sendGoodsPickupQrNotification: vi.fn().mockResolvedValue(true),
  sendPickupQrNotification: vi.fn().mockResolvedValue(true),
  sendMultiAvailabilityQrNotification: vi.fn().mockResolvedValue(true),
  sendConfirmationEmail: vi.fn().mockResolvedValue(true),
  sendWelcomeEmail: vi.fn().mockResolvedValue(true),
  sendRequestNotification: vi.fn().mockResolvedValue(true),
  sendDeliveryQrNotification: vi.fn().mockResolvedValue(true),
}));

// Mock Supabase storage
// NB: getPublicUrl è una funzione pura che ritorna una URL nota (vedi
// src/lib/supabase.ts:21). Viene usata in src/lib/legal.ts per scaricare
// i PDF e calcolare lo SHA-256. Il mock sotto ritorna sempre lo stesso
// URL; i test che vogliono simulare failure fanno override con
// vi.stubGlobal('fetch', ...) in resetAllMocks (vedi sotto).
vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { publicUrl: 'https://test.com/qr.png' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/qr.png' } }),
      }),
    },
  },
  supabaseAdmin: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-id', email: 'test@test.it' }, session: null },
        error: null,
      }),
      admin: {
        listUsers: vi.fn().mockResolvedValue({ users: [], error: null }),
        createUser: vi.fn().mockResolvedValue({ user: { id: 'test-id' }, error: null }),
      },
    },
  },
  getPublicUrl: vi.fn().mockReturnValue('https://test.com/legal/terms/v1.0.pdf'),
}));

// Mock QR code generation - only mock the async upload functions
// Keep the pure functions so they can be tested
vi.mock('@/lib/qrcode', () => ({
  generateAndUploadQrCode: vi.fn().mockResolvedValue('https://test.com/qr.png'),
  generateAndUploadQrCodeWithLogo: vi.fn().mockResolvedValue('https://test.com/qr-logo.png'),
  generateDeliverQrCode: (requestId: string, donorId: string) => `kykos:deliver:${requestId}:${donorId}`,
  generatePickupQrCode: (requestId: string, beneficiaryId: string) => `kykos:pickup:${requestId}:${beneficiaryId}`,
  parseQrCodeData: (data: string) => {
    if (typeof data !== 'string') return null;
    // New format: kykos:{subType}:{action}:{requestId}:{userId}
    const newFormat = data.match(/^kykos:(goods|object|multiavailability):(deliver|pickup):(.+):(.+)$/);
    if (newFormat) {
      return {
        subType: newFormat[1] as 'goods' | 'object' | 'multiavailability',
        type: newFormat[2] as 'deliver' | 'pickup',
        requestId: newFormat[3],
        userId: newFormat[4],
      };
    }
    // Legacy format: kykos:deliver:{requestId}:{userId}
    const deliverMatch = data.match(/^kykos:deliver:(.+):(.+)$/);
    if (deliverMatch) return { type: 'deliver' as const, requestId: deliverMatch[1], userId: deliverMatch[2] };
    const pickupMatch = data.match(/^kykos:pickup:(.+):(.+)$/);
    if (pickupMatch) return { type: 'pickup' as const, requestId: pickupMatch[1], userId: pickupMatch[2] };
    return null;
  },
}));

// Mock file-type — per-test override via mockFileTypeFromBuffer
export const mockFileTypeFromBuffer = vi.fn();
vi.mock('file-type', () => ({
  fileTypeFromBuffer: mockFileTypeFromBuffer,
}));

export function resetAllMocks() {
  vi.clearAllMocks();
  // Default: LegalDocumentVersion.findMany (per getActiveVersions) ritorna
  // v1.0 attiva per TERMS e PRIVACY. I test che vogliono versioni diverse
  // (es. outdated scenario) fanno override con mockResolvedValueOnce.
  mockPrisma.legalDocumentVersion.findMany.mockImplementation(async (args: any) => {
    if (args?.where?.status === 'active') {
      return [
        { type: 'TERMS', version: '1.0' },
        { type: 'PRIVACY', version: '1.0' },
      ];
    }
    return [];
  });
  // Default: mock di fetch per getDocumentHash (legge PDF da Supabase
  // Storage in src/lib/legal.ts). Ritorna 4 byte fissi → SHA-256 noto.
  // I test che vogliono simulare storage error fanno override per singola
  // chiamata con vi.stubGlobal temporaneo.
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    arrayBuffer: async () => new ArrayBuffer(4),
  } as any));
}
