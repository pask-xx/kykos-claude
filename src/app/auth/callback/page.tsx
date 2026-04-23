'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    async function handleCallback() {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Get the session from Supabase (this handles the code exchange automatically)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('Supabase session error:', sessionError);
        setError('session_error');
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

      // Create our own session by calling our API
      try {
        const res = await fetch('/api/auth/oauth-create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name }),
        });

        if (!res.ok) {
          throw new Error('Failed to create session');
        }

        const data = await res.json();

        // Redirect based on role
        switch (data.user.role) {
          case 'DONOR':
            router.push('/donor/dashboard');
            break;
          case 'RECIPIENT':
            router.push('/recipient/dashboard');
            break;
          case 'INTERMEDIARY':
            router.push('/intermediary/dashboard');
            break;
          case 'ADMIN':
            router.push('/admin/dashboard');
            break;
          default:
            router.push('/');
        }
      } catch (err) {
        console.error('Session creation error:', err);
        router.push('/auth/login?error=session_creation_failed');
      }
    }

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Errore di autenticazione. Riprova.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Accesso in corso...</p>
    </div>
  );
}
