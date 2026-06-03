import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('jose', () => ({ jwtVerify: vi.fn() }));

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { mockPrisma, resetAllMocks, mockFileTypeFromBuffer } from '../../setup/mocks';
import { POST as uploadPOST } from '@/app/api/upload/route';
import { POST as profilePhotoPOST } from '@/app/api/profile-photo/route';
import { POST as cvPOST } from '@/app/api/volunteer/upload-cv/route';

const mockCookies = vi.mocked(cookies);
const mockJwtVerify = vi.mocked(jwtVerify);
const mockFetch = vi.fn();

// Magic bytes fixtures (only the first few bytes matter for file-type detection)
const JPEG_BUFFER = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
const PNG_BUFFER = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
const PDF_BUFFER = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x00, 0x00]);
// Windows PE / DOS executable (MZ header)
const EXE_BUFFER = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00]);
// Plaintext - no recognizable magic bytes
const TEXT_BUFFER = Buffer.from('This is a plain text file with no magic bytes.');

// Build a multipart/form-data request that mimics what the browser sends
function buildUploadRequest(filename: string, contentType: string, buffer: Buffer) {
  // We can't construct a real File in test env, so we mock the formData() method
  const file = {
    name: filename,
    type: contentType,
    size: buffer.length,
    arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  };
  const formData = { get: (key: string) => (key === 'file' ? file : null) };
  return {
    formData: async () => formData,
  } as unknown as Request;
}

beforeEach(() => {
  resetAllMocks();
  mockCookies.mockReset();
  mockJwtVerify.mockReset();
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);

  // Default: user session (DONOR)
  mockCookies.mockImplementation(async () => ({
    get: (name: string) => (name === 'session' ? { value: 'valid' } : undefined),
    delete: () => undefined,
  }) as any);
  mockJwtVerify.mockImplementation(async () => ({
    payload: { user: { id: 'u-1', email: 'u@test.it', name: 'Test User', role: 'DONOR' } },
  }) as any);

  // Default: supabase fetch returns success
  mockFetch.mockImplementation(async () => ({
    ok: true,
    status: 200,
    text: async () => '',
  }) as any);

  // Default: prisma updates succeed (for profile-photo route)
  mockPrisma.user.update.mockImplementation(async (args: any) => ({
    id: args.where.id,
    profileImageUrl: args.data.profileImageUrl,
  }) as any);
  mockPrisma.operator.update.mockImplementation(async (args: any) => ({
    id: args.where.id,
    profileImageUrl: args.data.profileImageUrl,
  }) as any);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('A7 — magic bytes validation on /api/upload (images)', () => {
  it('accepts valid JPEG (magic bytes match) and uploads with detected MIME/ext', async () => {
    mockFileTypeFromBuffer.mockResolvedValueOnce({ ext: 'jpg', mime: 'image/jpeg' });

    const req = buildUploadRequest('photo.jpg', 'image/jpeg', JPEG_BUFFER);
    const response = await uploadPOST(req);

    expect(response.status).toBe(200);
    const body = await response.json();
    // Path uses the REAL ext from magic bytes, not from client filename
    expect(body.path).toMatch(/\.jpg$/);

    // Supabase upload called with the real MIME
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/storage/v1/object/objects/u-1/');
    expect((init as any).headers['Content-Type']).toBe('image/jpeg');
  });

  it('accepts valid PNG and uses .png extension (even if client named it .jpg)', async () => {
    mockFileTypeFromBuffer.mockResolvedValueOnce({ ext: 'png', mime: 'image/png' });

    const req = buildUploadRequest('misleading.jpg', 'image/jpeg', PNG_BUFFER);
    const response = await uploadPOST(req);

    expect(response.status).toBe(200);
    const body = await response.json();
    // Real extension from magic bytes wins over client filename
    expect(body.path).toMatch(/\.png$/);
  });

  it('rejects executable masquerading as JPEG (PE header) with 400', async () => {
    mockFileTypeFromBuffer.mockResolvedValueOnce({ ext: 'exe', mime: 'application/x-msdownload' });

    const req = buildUploadRequest('virus.jpg', 'image/jpeg', EXE_BUFFER);
    const response = await uploadPOST(req);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/non consentito/);
    expect(body.error).toContain('application/x-msdownload');

    // No Supabase upload was attempted
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects file with no recognizable magic bytes (plaintext) with 400', async () => {
    mockFileTypeFromBuffer.mockResolvedValueOnce(undefined);

    const req = buildUploadRequest('readme.jpg', 'image/jpeg', TEXT_BUFFER);
    const response = await uploadPOST(req);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/non riconoscibile/);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 401 when no session is present', async () => {
    mockCookies.mockImplementation(async () => ({
      get: () => undefined,
      delete: () => undefined,
    }) as any);

    const req = buildUploadRequest('a.jpg', 'image/jpeg', JPEG_BUFFER);
    const response = await uploadPOST(req);

    expect(response.status).toBe(401);
    expect(mockFileTypeFromBuffer).not.toHaveBeenCalled();
  });
});

describe('A7 — magic bytes validation on /api/profile-photo (images)', () => {
  it('accepts JPEG and uses .jpg extension (replacing the old hardcoded .jpg)', async () => {
    mockFileTypeFromBuffer.mockResolvedValueOnce({ ext: 'jpg', mime: 'image/jpeg' });

    const req = buildUploadRequest('me.jpg', 'image/jpeg', JPEG_BUFFER);
    const response = await profilePhotoPOST(req);

    expect(response.status).toBe(200);

    // Path uses real ext
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/profile-photos/u-1/photo.jpg');
    expect((init as any).headers['Content-Type']).toBe('image/jpeg');
  });

  it('A7 bonus: PNG now ends up in .png path (was hardcoded .jpg before)', async () => {
    mockFileTypeFromBuffer.mockResolvedValueOnce({ ext: 'png', mime: 'image/png' });

    const req = buildUploadRequest('me.jpg', 'image/jpeg', PNG_BUFFER);
    const response = await profilePhotoPOST(req);

    expect(response.status).toBe(200);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/photo.png');
  });

  it('rejects executable masquerading as image', async () => {
    mockFileTypeFromBuffer.mockResolvedValueOnce({ ext: 'exe', mime: 'application/x-msdownload' });

    const req = buildUploadRequest('malware.png', 'image/png', EXE_BUFFER);
    const response = await profilePhotoPOST(req);

    expect(response.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('A7 — magic bytes validation on /api/volunteer/upload-cv (mixed docs + images)', () => {
  it('accepts PDF (magic bytes match) and uploads with .pdf extension', async () => {
    mockFileTypeFromBuffer.mockResolvedValueOnce({ ext: 'pdf', mime: 'application/pdf' });

    const req = buildUploadRequest('cv.pdf', 'application/pdf', PDF_BUFFER);
    const response = await cvPOST(req);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.path).toContain('cvs/u-1/');
    expect(body.path).toMatch(/\.pdf$/);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/storage/v1/object/objects/cvs/u-1/');
    expect((init as any).headers['Content-Type']).toBe('application/pdf');
  });

  it('rejects EXE declared as application/pdf (mismatch magic bytes / declared MIME)', async () => {
    mockFileTypeFromBuffer.mockResolvedValueOnce({ ext: 'exe', mime: 'application/x-msdownload' });

    // Client claims it's a PDF, but it's actually an EXE
    const req = buildUploadRequest('cv.pdf', 'application/pdf', EXE_BUFFER);
    const response = await cvPOST(req);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/non consentito/);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects executable masquerading as document', async () => {
    mockFileTypeFromBuffer.mockResolvedValueOnce({ ext: 'exe', mime: 'application/x-msdownload' });

    const req = buildUploadRequest('cv.pdf', 'application/pdf', EXE_BUFFER);
    const response = await cvPOST(req);

    expect(response.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects file with no recognizable magic bytes (plaintext)', async () => {
    mockFileTypeFromBuffer.mockResolvedValueOnce(undefined);

    const req = buildUploadRequest('cv.pdf', 'application/pdf', TEXT_BUFFER);
    const response = await cvPOST(req);

    expect(response.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
