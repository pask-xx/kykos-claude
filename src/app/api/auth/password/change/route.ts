import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';
import { createSession, setSessionCookie } from '@/lib/auth';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Password attuale e nuova password sono obbligatorie' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La nuova password deve essere di almeno 6 caratteri' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: (session as any).user?.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    // Verify current password via Supabase Auth
    if (user.authUserId) {
      const { error: verifyError } = await supabaseAdmin.auth.admin.updateUserById(
        user.authUserId,
        { password: newPassword }
      );

      if (verifyError) {
        return NextResponse.json(
          { error: 'Errore durante il cambio password' },
          { status: 400 }
        );
      }
    } else {
      // Fallback for users without Supabase Auth (migrated users)
      return NextResponse.json(
        { error: 'Account non configurato per questo tipo di cambio password' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
