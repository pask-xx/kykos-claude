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

  if (error) {
    return NextResponse.redirect(new URL('/auth/login?error=' + error, process.env.NEXT_PUBLIC_BASE_URL));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=no_code', process.env.NEXT_PUBLIC_BASE_URL));
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Exchange code for session
    const { data: { user: supabaseUser }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !supabaseUser) {
      console.error('OAuth exchange error:', exchangeError);
      return NextResponse.redirect(new URL('/auth/login?error=exchange_failed', process.env.NEXT_PUBLIC_BASE_URL));
    }

    const email = supabaseUser.email;
    const name = (supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || email?.split('@')[0] || 'User') as string;

    if (!email) {
      return NextResponse.redirect(new URL('/auth/login?error=no_email', process.env.NEXT_PUBLIC_BASE_URL));
    }

    // Map role string to Role enum
    const userRole: Role = role === 'recipient' ? 'RECIPIENT' : 'DONOR';

    // Check if user exists in our DB
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // If user doesn't exist, create them
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: '',
          role: userRole,
          donorProfile: userRole === 'DONOR' ? {
            create: {
              level: 'BRONZE',
              totalDonations: 0,
              totalObjects: 0,
            },
          } : undefined,
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

    // Redirect to profile completion
    return NextResponse.redirect(new URL('/profile/complete', process.env.NEXT_PUBLIC_BASE_URL));
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(new URL('/auth/login?error=server_error', process.env.NEXT_PUBLIC_BASE_URL));
  }
}
