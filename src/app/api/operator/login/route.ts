import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';
import { getJwtSecret, setOperatorSessionCookie } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';

const JWT_SECRET = getJwtSecret();

export const POST = withErrorHandler(async (request: Request) => {

  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Username e password sono obbligatorie' },
      { status: 400 }
    );
  }

  // Find operator by username (case-insensitive)
  const operator = await prisma.operator.findFirst({
    where: {
      username: {
        equals: username,
        mode: 'insensitive',
      },
    },
    include: {
      organization: true,
    },
  });

  if (!operator) {
    return NextResponse.json(
      { error: 'Username o password non validi' },
      { status: 401 }
    );
  }

  if (!operator.active) {
    return NextResponse.json(
      { error: 'Account disattivato' },
      { status: 401 }
    );
  }

  // Operator email for Supabase Auth is reconstructed from username
  const operatorEmail = `${operator.username}@kykos.operators`;

  if (!operator.email) {
    return NextResponse.json(
      { error: 'Account operatore non configurato correttamente' },
      { status: 500 }
    );
  }

  // Use Supabase Auth to verify password
  const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
    email: operatorEmail,
    password,
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: 'Username o password non validi' },
      { status: 401 }
    );
  }

  // Create JWT token for app-level session
  const token = await new SignJWT({
    operatorId: operator.id,
    organizationId: operator.organizationId,
    username: operator.username,
    role: operator.role,
    isStreetOperator: operator.isStreetOperator,
    isOfficeOperator: operator.isOfficeOperator,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  // Set cookie (helper centralizzato in src/lib/auth.ts)
  await setOperatorSessionCookie(token);

  return NextResponse.json({
    operator: {
      id: operator.id,
      username: operator.username,
      email: operator.email,
      phone: operator.phone,
      firstName: operator.firstName,
      lastName: operator.lastName,
      role: operator.role,
      isStreetOperator: operator.isStreetOperator,
      isOfficeOperator: operator.isOfficeOperator,
      organization: {
        id: operator.organization.id,
        name: operator.organization.name,
        type: operator.organization.type,
      },
    },
  });

}, 'POST /api/operator/login');
