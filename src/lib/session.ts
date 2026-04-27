import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export interface SupabaseSessionUser {
  id: string;
  email: string;
  role?: string;
}

/**
 * Get current Supabase Auth session from cookies
 * Use in server components and API routes
 */
export async function getSupabaseSession(): Promise<SupabaseSessionUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;

  if (!accessToken) {
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email || '',
    role: user.role,
  };
}

/**
 * Set Supabase Auth session cookie
 */
export async function setSupabaseSessionCookie(accessToken: string, refreshToken?: string) {
  const cookieStore = await cookies();

  cookieStore.set('sb-access-token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  if (refreshToken) {
    cookieStore.set('sb-refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
  }
}

/**
 * Clear Supabase Auth session cookie
 */
export async function clearSupabaseSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('sb-access-token');
  cookieStore.delete('sb-refresh-token');
}
