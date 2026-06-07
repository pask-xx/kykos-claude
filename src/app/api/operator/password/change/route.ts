import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';
import { getJwtSecret, clearOperatorSessionCookie } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';

const JWT_SECRET = getJwtSecret();

interface OperatorSession {
  operatorId: string;
  organizationId: string;
  username: string;
  role: string;
}

async function getOperatorSession(): Promise<OperatorSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('operator_session')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as OperatorSession;
  } catch {
    return null;
  }
}

export const POST = withErrorHandler(async (request: Request) => {

  const session = await getOperatorSession();

  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { newPassword } = await request.json();

  if (!newPassword) {
    return NextResponse.json(
      { error: 'Nuova password obbligatoria' },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: 'La nuova password deve essere di almeno 6 caratteri' },
      { status: 400 }
    );
  }

  const operator = await prisma.operator.findUnique({
    where: { id: session.operatorId },
  });

  if (!operator) {
    return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
  }

  // Check if operator has Supabase Auth
  if (!operator.supabaseAuthId) {
    return NextResponse.json(
      { error: 'Operatore non configurato per questo tipo di cambio password' },
      { status: 400 }
    );
  }

  // Update password via Supabase Admin API
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    operator.supabaseAuthId,
    { password: newPassword }
  );

  if (updateError) {
    return NextResponse.json(
      { error: 'Errore durante il cambio password' },
      { status: 400 }
    );
  }

  // Invalida la sessione corrente per forzare re-login con la nuova password.
  // Senza questo, l'operatore mantiene il cookie operator_session valido (JWT 7d)
  // anche dopo il cambio password e può rientrare con la sessione vecchia
  // finché il cookie non scade. Cfr. TODO.md sezione "Bug pre-esistenti".
  await clearOperatorSessionCookie();

  return NextResponse.json({ success: true });

}, 'POST /api/operator/password/change');
