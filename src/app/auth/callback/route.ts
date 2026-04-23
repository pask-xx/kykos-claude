import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { createSession, setSessionCookie } from '@/lib/auth';
import { Role } from '@prisma/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const role = searchParams.get('role') || 'donor';

  console.log('=== OAuth Callback ===');
  console.log('Has code:', !!code);
  console.log('Has error:', !!error);
  console.log('Role:', role);

  if (error) {
    console.log('OAuth error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=' + error, process.env.NEXT_PUBLIC_BASE_URL));
  }

  if (!code) {
    console.log('No code in URL');
    return NextResponse.redirect(new URL('/auth/login?error=no_code', process.env.NEXT_PUBLIC_BASE_URL));
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log('Exchanging code for session...');
    const { data: { user: supabaseUser }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    console.log('Exchange result - user:', !!supabaseUser, 'error:', exchangeError);

    if (exchangeError || !supabaseUser) {
      console.error('OAuth exchange error:', exchangeError);
      return NextResponse.redirect(new URL('/auth/login?error=exchange_failed', process.env.NEXT_PUBLIC_BASE_URL));
    }

    const email = supabaseUser.email;
    const name = (supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || email?.split('@')[0] || 'User') as string;

    console.log('OAuth user email:', email);

    if (!email) {
      console.log('No email in OAuth user');
      return NextResponse.redirect(new URL('/auth/login?error=no_email', process.env.NEXT_PUBLIC_BASE_URL));
    }

    // Check if user already exists in our DB
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    console.log('Existing user in DB:', !!existingUser, existingUser?.role);

    if (existingUser) {
      // User exists - create session and redirect to dashboard
      const token = await createSession({
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
      });

      await setSessionCookie(token);

      console.log('Session created, redirecting...');

      // Redirect based on role
      const redirectMap: Record<string, string> = {
        DONOR: '/donor/dashboard',
        RECIPIENT: '/recipient/dashboard',
        INTERMEDIARY: '/intermediary/dashboard',
        ADMIN: '/admin/dashboard',
      };

      return NextResponse.redirect(
        new URL(redirectMap[existingUser.role] || '/', process.env.NEXT_PUBLIC_BASE_URL)
      );
    }

    // User doesn't exist - redirect to register page with OAuth data
    console.log('User new, redirecting to register...');
    const registerUrl = new URL('/auth/register', process.env.NEXT_PUBLIC_BASE_URL);
    registerUrl.searchParams.set('oauth', '1');
    registerUrl.searchParams.set('email', email);
    registerUrl.searchParams.set('name', name);
    registerUrl.searchParams.set('role', role);

    return NextResponse.redirect(registerUrl);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(new URL('/auth/login?error=server_error', process.env.NEXT_PUBLIC_BASE_URL));
  }
}
