import { vi } from 'vitest';

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
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  object: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  donation: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock jose JWT library
vi.mock('jose', () => ({
  jwtVerify: vi.fn().mockResolvedValue({ payload: {} }),
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue('mock-token'),
  })),
}));

// Mock email functions to prevent actual emails
vi.mock('@/lib/email', () => ({
  sendGoodsDeliveryQrNotification: vi.fn().mockResolvedValue(true),
  sendGoodsPickupQrNotification: vi.fn().mockResolvedValue(true),
  sendPickupQrNotification: vi.fn().mockResolvedValue(true),
  sendConfirmationEmail: vi.fn().mockResolvedValue(true),
  sendWelcomeEmail: vi.fn().mockResolvedValue(true),
}));

// Mock Supabase storage
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
      admin: {
        listUsers: vi.fn().mockResolvedValue({ users: [], error: null }),
        createUser: vi.fn().mockResolvedValue({ user: { id: 'test-id' }, error: null }),
      },
    },
  },
}));

// Mock QR code generation - only mock the async upload function
// Keep the pure functions so they can be tested
vi.mock('@/lib/qrcode', () => ({
  generateAndUploadQrCode: vi.fn().mockResolvedValue('https://test.com/qr.png'),
  generateDeliverQrCode: (requestId: string, donorId: string) => `kykos:deliver:${requestId}:${donorId}`,
  generatePickupQrCode: (requestId: string, beneficiaryId: string) => `kykos:pickup:${requestId}:${beneficiaryId}`,
  parseQrCodeData: (data: string) => {
    if (typeof data !== 'string') return null;
    const deliverMatch = data.match(/^kykos:deliver:(.+):(.+)$/);
    if (deliverMatch) return { type: 'deliver' as const, requestId: deliverMatch[1], userId: deliverMatch[2] };
    const pickupMatch = data.match(/^kykos:pickup:(.+):(.+)$/);
    if (pickupMatch) return { type: 'pickup' as const, requestId: pickupMatch[1], userId: pickupMatch[2] };
    return null;
  },
}));

export function resetAllMocks() {
  vi.clearAllMocks();
}
