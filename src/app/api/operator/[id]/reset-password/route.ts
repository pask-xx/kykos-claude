import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'INTERMEDIARY') {
      return NextResponse.json(
        { error: 'Solo gli intermediari possono resettare le password' },
        { status: 403 }
      );
    }

    const { operatorId } = await request.json();

    if (!operatorId) {
      return NextResponse.json({ error: 'ID operatore mancante' }, { status: 400 });
    }

    // Get organization for current user
    const organization = await prisma.organization.findUnique({
      where: { userId: session.id },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
    }

    // Get operator to reset
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
    });

    if (!operator || operator.organizationId !== organization.id) {
      return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
    }

    // Check if operator has Supabase Auth
    if (!operator.supabaseAuthId || !operator.email) {
      return NextResponse.json(
        { error: 'Operatore non configurato per il reset password automatico' },
        { status: 400 }
      );
    }

    // Reset password via Supabase Admin API
    const tempPassword = 'cambiamisubito';
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      operator.supabaseAuthId,
      { password: tempPassword }
    );

    if (updateError) {
      return NextResponse.json(
        { error: 'Errore durante il reset password' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Password resettata. La nuova password temporanea è: ${tempPassword}`,
      temporaryPassword: tempPassword,
    });
  } catch (error) {
    console.error('Operator password reset error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
