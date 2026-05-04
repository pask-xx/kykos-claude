import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // Verify admin setup secret
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.ADMIN_SETUP_SECRET;

    console.log('[ADMIN_SETUP] authHeader:', authHeader);
    console.log('[ADMIN_SETUP] expectedSecret:', expectedSecret);

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password e nome sono obbligatori' },
        { status: 400 }
      );
    }

    // Check if user already exists in KYKOS DB
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Utente già esistente' }, { status: 400 });
    }

    // Create admin user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'ADMIN',
        fullName: name,
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Errore durante la creazione dell\'account admin' },
        { status: 500 }
      );
    }

    // Create admin user in KYKOS DB
    const user = await prisma.user.create({
      data: {
        authUserId: authData.user.id,
        email,
        name,
        role: 'ADMIN',
        // No passwordHash - Supabase handles auth
      },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
