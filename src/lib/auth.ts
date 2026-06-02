import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { Role } from '@prisma/client';

/**
 * Single source of truth for the JWT secret.
 * Throws on import if JWT_SECRET is not set, so misconfigured deployments
 * fail loudly at startup rather than silently signing tokens with a public key.
 */
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable is required. ' +
        'Set it in .env (or in Vercel project settings) before starting the app.'
    );
  }
  return new TextEncoder().encode(secret);
}

export { getJwtSecret };
const JWT_SECRET = getJwtSecret();

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/**
 * Create an app-level session JWT (after Supabase Auth confirms identity)
 * This is separate from Supabase Auth session - used for role-based authorization
 */
export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return token;
}

/**
 * Get current user session from cookie
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.user as SessionUser;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
