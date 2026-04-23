import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { createSession, setSessionCookie } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const error = requestUrl.searchParams.get('error');
  const code = requestUrl.searchParams.get('code');
  const hash = requestUrl.hash;

  console.log('=== OAUTH CALLBACK ===');
  console.log('URL:', requestUrl.toString());
  console.log('Has code:', !!code);
  console.log('Has hash:', !!hash);

  if (error) {
    console.log('OAuth error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=' + error, process.env.NEXT_PUBLIC_BASE_URL));
  }

  // Handle authorization code flow (standard)
  if (code) {
    console.log('Exchanging code for session...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user: supabaseUser }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !supabaseUser) {
      console.error('OAuth exchange error:', exchangeError);
      return NextResponse.redirect(new URL('/auth/login?error=exchange_failed', process.env.NEXT_PUBLIC_BASE_URL));
    }

    return await handleUserSession(supabaseUser);
  }

  // Handle implicit flow (access_token in hash) - fallback
  if (hash && hash.includes('access_token=')) {
    console.log('Implicit flow detected, parsing hash...');
    try {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (sessionError || !user) {
          console.error('Session set error:', sessionError);
          return NextResponse.redirect(new URL('/auth/login?error=session_failed', process.env.NEXT_PUBLIC_BASE_URL));
        }

        return await handleUserSession(user);
      }
    } catch (err) {
      console.error('Implicit flow error:', err);
    }
  }

  console.log('No code or hash found');
  return NextResponse.redirect(new URL('/auth/login?error=no_code', process.env.NEXT_PUBLIC_BASE_URL));
}

async function handleUserSession(supabaseUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): Promise<NextResponse> {
  const email = supabaseUser.email;
  const name = (supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || email?.split('@')[0] || 'User') as string;

  if (!email) {
    return NextResponse.redirect(new URL('/auth/login?error=no_email', process.env.NEXT_PUBLIC_BASE_URL));
  }

  console.log('Processing user:', email);

  // Check if user exists in our DB
  let user = await prisma.user.findUnique({
    where: { email },
  });

  // If user doesn't exist, create them as DONOR by default
  if (!user) {
    console.log('Creating new user for:', email);
    user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: '', // No password for OAuth users
        role: 'DONOR',
        donorProfile: {
          create: {
            level: 'BRONZE',
            totalDonations: 0,
            totalObjects: 0,
          },
        },
      },
    });
  }

  // Create our app session
  const token = await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  await setSessionCookie(token);

  console.log('User session created, redirecting based on role:', user.role);

  // Redirect based on role
  const redirectMap: Record<string, string> = {
    DONOR: '/donor/dashboard',
    RECIPIENT: '/recipient/dashboard',
    INTERMEDIARY: '/intermediary/dashboard',
    ADMIN: '/admin/dashboard',
  };

  const redirectTo = redirectMap[user.role] || '/';

  return NextResponse.redirect(new URL(redirectTo, process.env.NEXT_PUBLIC_BASE_URL));
}
