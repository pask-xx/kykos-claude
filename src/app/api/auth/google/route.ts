import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') || 'donor';

  const redirectTo = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?role=${role}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    return NextResponse.redirect(new URL('/auth/login?error=oauth_error', process.env.NEXT_PUBLIC_BASE_URL));
  }

  return NextResponse.redirect(data.url);
}
