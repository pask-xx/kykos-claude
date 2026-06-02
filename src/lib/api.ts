import { NextResponse } from 'next/server';

/**
 * Standard success response shape.
 *
 * Every KYKOS API endpoint returns `{ success: true, data: ... }` on 2xx,
 * so clients can branch on `response.success` instead of HTTP status alone.
 */
export interface ApiOk<T> {
  success: true;
  data: T;
}

/**
 * Standard error response shape.
 *
 * Every KYKOS API endpoint returns `{ success: false, error: string }` on
 * non-2xx, so the client always gets a human-readable Italian message.
 */
export interface ApiErr {
  success: false;
  error: string;
}

/**
 * Wrap a successful payload in the standard response envelope.
 *
 * @example
 *   return apiOk({ user });
 *   return apiOk({ user }, { status: 201 });
 */
export function apiOk<T>(data: T, init?: ResponseInit): NextResponse<ApiOk<T>> {
  return NextResponse.json({ success: true, data }, init);
}

/**
 * Wrap an error message in the standard response envelope with a given status.
 * Defaults to 400 (bad request), use 401/403/404/409/500 as appropriate.
 *
 * @example
 *   return apiErr('Non autorizzato', 401);
 *   return apiErr('Permessi insufficienti', 403);
 */
export function apiErr(error: string, status: number = 400): NextResponse<ApiErr> {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * HOF that wraps a route handler with consistent error logging and a 500
 * response. Replaces the manual try/catch/console.error/return-500 boilerplate
 * that lived in 100+ API routes.
 *
 * The wrapped handler can still `throw` an `apiErr(...)`-shaped Response, or
 * call apiErr() and `return` it — anything thrown OR returned as a NextResponse
 * is passed through unchanged. Only truly unexpected exceptions hit the catch
 * and become a generic 500.
 *
 * @param fn   The route handler. Receives the raw Request + the route context
 *             (for dynamic [id] routes, that's `{ params: Promise<{id: string}> }`).
 * @param label Short label for the log line, e.g. 'GET /api/donor/requests'.
 *
 * @example
 *   // Before (in a route file):
 *   export async function GET() {
 *     try {
 *       const session = await getSession();
 *       if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
 *       // ... business logic ...
 *       return NextResponse.json({ users });
 *     } catch (error) {
 *       console.error('GET /api/users error:', error);
 *       return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
 *     }
 *   }
 *
 *   // After:
 *   export const GET = withErrorHandler(async () => {
 *     const session = await getSession();
 *     if (!session) return apiErr('Non autorizzato', 401);
 *     // ... business logic ...
 *     return apiOk({ users });
 *   }, 'GET /api/users');
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
