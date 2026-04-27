import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token e nuova password sono obbligatori' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La password deve essere di almeno 6 caratteri' },
        { status: 400 }
      );
    }

    // Verify the JWT token
    let payload;
    try {
      const { payload: p } = await jwtVerify(token, JWT_SECRET);
      payload = p;
    } catch {
      return NextResponse.json(
        { error: 'Token non valido o scaduto' },
        { status: 400 }
      );
    }

    // Check token purpose
    if ((payload as any).purpose !== 'password_reset') {
      return NextResponse.json(
        { error: 'Token non valido per questo uso' },
        { status: 400 }
      );
    }

    const userId = (payload as any).userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'Token non valido' },
        { status: 400 }
      );
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      );
    }

    // Update password via Supabase Auth
    if (user.authUserId) {
      // User has Supabase Auth account - update password directly
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.authUserId,
        { password: newPassword }
      );

      if (updateError) {
        return NextResponse.json(
          { error: 'Errore durante il reset password' },
          { status: 400 }
        );
      }
    } else if (user.passwordHash) {
      // Legacy account with passwordHash but no Supabase Auth - migrate to Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.name,
        },
      });

      if (authError || !authData.user) {
        console.error('Supabase Auth migration error:', authError);
        return NextResponse.json(
          { error: 'Errore durante la migrazione dell\'account' },
          { status: 400 }
        );
      }

      // Update user with new authUserId and clear old passwordHash
      await prisma.user.update({
        where: { id: user.id },
        data: {
          authUserId: authData.user.id,
          passwordHash: null,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Account non configurato per questo tipo di reset' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reimpostata con successo',
    });
  } catch (error) {
    console.error('Password reset confirm error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
