import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  console.log('=== GOOGLE OAUTH INIT ===');
  console.log('Base URL:', process.env.NEXT_PUBLIC_BASE_URL);

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`,
    },
  });

  console.log('OAuth data url:', data?.url);
  console.log('OAuth error:', error);

  if (error) {
    return NextResponse.redirect(new URL('/auth/login?error=oauth_error', process.env.NEXT_PUBLIC_BASE_URL));
  }

  return NextResponse.redirect(data.url);
}
