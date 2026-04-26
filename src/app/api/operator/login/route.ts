import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

export async function POST(request: Request) {
  try {
    const { orgCode, username, password } = await request.json();

    if (!orgCode || !username || !password) {
      return NextResponse.json(
        { error: 'Codice ente, username e password sono obbligatori' },
        { status: 400 }
      );
    }

    // Find organization by code (normalize to uppercase)
    const organization = await prisma.organization.findUnique({
      where: { code: orgCode.toUpperCase() },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Codice ente non valido' },
        { status: 401 }
      );
    }

    // Find operator by username within organization
    const operator = await prisma.operator.findUnique({
      where: {
        organizationId_username: {
          organizationId: organization.id,
          username: username,
        },
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

    // Verify password
    const passwordHash = await hashPassword(password);
    if (passwordHash !== operator.passwordHash) {
      return NextResponse.json(
        { error: 'Username o password non validi' },
        { status: 401 }
      );
    }

    // Create JWT token
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
          id: organization.id,
          name: organization.name,
          type: organization.type,
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
