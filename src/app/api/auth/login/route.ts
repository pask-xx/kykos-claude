import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';
import { createSession, setSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e password sono obbligatorie' },
        { status: 400 }
      );
    }

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      );
    }

    // Find or create user in KYKOS DB
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // If user doesn't exist but has Supabase auth, they might need to complete registration
    if (!user) {
      return NextResponse.json(
        { error: 'Account non trovato. Completa la registrazione prima di accedere.' },
        { status: 401 }
      );
    }

    // Check if email is confirmed
    if (!user.emailConfirmed) {
      return NextResponse.json(
        { error: 'Devi confermare la tua email prima di accedere. Controlla la tua casella di posta.' },
        { status: 403 }
      );
    }

    // Create app-level session
    const token = await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
