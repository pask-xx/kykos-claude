import { NextResponse } from 'next/server';

/**
 * Standard success response shape.
 */
export interface ApiOk<T> {
  success: true;
  data: T;
}

export interface ApiErr {
  success: false;
  error: string;
}

export function apiOk<T>(data: T, init?: ResponseInit): NextResponse<ApiOk<T>> {
  return NextResponse.json({ success: true, data }, init);
}

export function apiErr(error: string, status: number = 400): NextResponse<ApiErr> {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * HOF that wraps a route handler with consistent error logging and 500 response.
 * Use: export const GET = withErrorHandler(async (req) => { ... }, 'GET /api/foo');
 */
export function withErrorHandler<P = unknown>(
  fn: (req: Request, ctx: P) => Promise<Response>,
  label: string
): (req: Request, ctx: P) => Promise<Response> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (error) {
      console.error(`${label} error:`, error);
      return apiErr('Errore interno', 500);
    }
  };
}
