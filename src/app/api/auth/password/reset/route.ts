import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email obbligatoria' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'Se l\'email esiste, riceverai le istruzioni per reimpostare la password.'
      });
    }

    // Generate JWT reset token (valid for 1 hour)
    const resetToken = await new SignJWT({
      userId: user.id,
      purpose: 'password_reset',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(JWT_SECRET);

    // In production, send email:
    // const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;
    // await sendEmail({ to: user.email, subject: 'Reset password KYKOS', html: `Click <a href="${resetUrl}">here</a> to reset your password` });

    // DEV MODE - return token directly so you can test
    const isDev = process.env.NODE_ENV !== 'production';
    const resetUrl = isDev
      ? `/auth/reset-password?token=${resetToken}`
      : null;

    return NextResponse.json({
      message: 'Se l\'email esiste, riceverai le istruzioni per reimpostare la password.',
      ...(isDev && { resetUrl, token: resetToken }),
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
