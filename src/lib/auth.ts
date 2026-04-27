import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { Role } from '@prisma/client';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

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
