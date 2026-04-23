'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'donor';

  useEffect(() => {
    async function handleCallback() {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Get session from Supabase - this automatically reads the code from URL and exchanges it
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        router.push('/auth/login?error=no_session');
        return;
      }

      const supabaseUser = session.user;
      const email = supabaseUser.email;
      const name = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || email?.split('@')[0] || 'User';

      if (!email) {
        router.push('/auth/login?error=no_email');
        return;
      }

      // Check if user exists in our DB via API
      try {
        const res = await fetch('/api/auth/oauth-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (data.exists && data.user) {
          // User exists - redirect to dashboard
          const redirectMap: Record<string, string> = {
            DONOR: '/donor/dashboard',
            RECIPIENT: '/recipient/dashboard',
            INTERMEDIARY: '/intermediary/dashboard',
            ADMIN: '/admin/dashboard',
          };
          router.push(redirectMap[data.user.role] || '/');
        } else {
          // User doesn't exist - go to register with OAuth data
          const registerUrl = new URL('/auth/register', window.location.origin);
          registerUrl.searchParams.set('oauth', '1');
          registerUrl.searchParams.set('email', email);
          registerUrl.searchParams.set('name', name);
          registerUrl.searchParams.set('role', role);
          router.push(registerUrl.toString());
        }
      } catch (err) {
        console.error('OAuth check error:', err);
        router.push('/auth/login?error=server_error');
      }
    }

    handleCallback();
  }, [router, role]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Accesso in corso...</p>
    </div>
  );
}
