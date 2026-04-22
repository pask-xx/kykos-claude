import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { createSession, setSessionCookie } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');

  // Debug logging for Vercel
  console.log('=== OAUTH CALLBACK DEBUG ===');
  console.log('Full URL:', requestUrl.toString());
  console.log('Code present:', !!code);
  console.log('Error param:', error);
  console.log('Supabase URL configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);

  if (error) {
    console.log('Redirecting due to error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=' + error, process.env.NEXT_PUBLIC_BASE_URL));
  }

  if (!code) {
    console.log('No code present in callback URL');
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

    // Get user metadata from Google
    const email = supabaseUser.email;
    const name = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || email?.split('@')[0] || 'User';
    const avatarUrl = supabaseUser.user_metadata?.avatar_url || null;

    if (!email) {
      return NextResponse.redirect(new URL('/auth/login?error=no_email', process.env.NEXT_PUBLIC_BASE_URL));
    }

    // Check if user already exists in our DB
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // If user doesn't exist, create them as DONOR by default
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: '', // No password for OAuth users
          role: 'DONOR',
          // Create donor profile
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

    // Redirect based on role
    const redirectMap: Record<string, string> = {
      DONOR: '/donor/dashboard',
      RECIPIENT: '/recipient/dashboard',
      INTERMEDIARY: '/intermediary/dashboard',
      ADMIN: '/admin/dashboard',
    };

    const redirectTo = redirectMap[user.role] || '/';

    return NextResponse.redirect(new URL(redirectTo, process.env.NEXT_PUBLIC_BASE_URL));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=server_error', process.env.NEXT_PUBLIC_BASE_URL));
  }
}
