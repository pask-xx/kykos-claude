import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiOk, apiErr, withErrorHandler } from '@/lib/api';

describe('apiOk', () => {
  it('wraps data in { success: true, data }', async () => {
    const response = apiOk({ user: { id: 'u-1' } });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true, data: { user: { id: 'u-1' } } });
  });

  it('accepts a custom init (e.g. status 201)', async () => {
    const response = apiOk({ id: 'new' }, { status: 201 });
    expect(response.status).toBe(201);
  });
});

describe('apiErr', () => {
  it('wraps error in { success: false, error } with default 400', async () => {
    const response = apiErr('Bad input');
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ success: false, error: 'Bad input' });
  });

  it('accepts a custom status (401, 403, 404, 500)', async () => {
    expect(apiErr('Unauthorized', 401).status).toBe(401);
    expect(apiErr('Forbidden', 403).status).toBe(403);
    expect(apiErr('Not found', 404).status).toBe(404);
    expect(apiErr('Internal', 500).status).toBe(500);
  });
});

describe('withErrorHandler (E3+E4 HOF)', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('passes through successful responses unchanged', async () => {
    const handler = withErrorHandler(async () => apiOk({ ok: true }), 'TEST label');
    const response = await handler(new Request('http://test/'), undefined as any);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('passes through explicit apiErr responses (4xx stay 4xx, not 500)', async () => {
    const handler = withErrorHandler(async () => apiErr('Unauthorized', 401), 'TEST label');
    const response = await handler(new Request('http://test/'), undefined as any);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('catches unexpected throws and returns 500 with Italian message', async () => {
    const handler = withErrorHandler(
      async () => {
        throw new Error('database connection lost');
      },
      'TEST label'
    );
    const response = await handler(new Request('http://test/'), undefined as any);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ success: false, error: 'Errore interno' });
  });

  it('logs the error with the provided label', async () => {
    const handler = withErrorHandler(
      async () => {
        throw new Error('boom');
      },
      'GET /api/example'
    );
    await handler(new Request('http://test/'), undefined as any);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'GET /api/example error:',
      expect.any(Error)
    );
  });

  it('forwards the request and context to the wrapped handler', async () => {
    const seen: { url: string; ctx: unknown } = { url: '', ctx: null };
    const handler = withErrorHandler(
      async (req, ctx) => {
        seen.url = req.url;
        seen.ctx = ctx;
        return apiOk({});
      },
      'forwarding test'
    );
    const ctx = { params: { id: '42' } };
    await handler(new Request('http://test/foo'), ctx as any);
    expect(seen.url).toBe('http://test/foo');
    expect(seen.ctx).toEqual(ctx);
  });
});
