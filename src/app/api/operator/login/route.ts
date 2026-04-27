import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username e password sono obbligatorie' },
        { status: 400 }
      );
    }

    // Find operator by username (username is unique across all organizations)
    const operator = await prisma.operator.findUnique({
      where: { username },
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
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('operator_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      operator: {
        id: operator.id,
        username: operator.username,
        email: operator.email,
        phone: operator.phone,
        firstName: operator.firstName,
        lastName: operator.lastName,
        role: operator.role,
        organization: {
          id: operator.organization.id,
          name: operator.organization.name,
          type: operator.organization.type,
        },
      },
    });
  } catch (error) {
    console.error('Operator login error:', error);
    return NextResponse.json(
      { error: 'Errore interno' },
      { status: 500 }
    );
  }
}
