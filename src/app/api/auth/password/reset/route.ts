import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';
import { sendPasswordResetEmail } from '@/lib/email';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

function getBaseUrl(request: Request): string {
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

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

    const baseUrl = getBaseUrl(request);
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    // Send email via Resend
    const emailSent = await sendPasswordResetEmail(user.email, resetUrl);

    if (!emailSent) {
      console.error('Failed to send password reset email to:', user.email);
    }

    return NextResponse.json({
      message: 'Se l\'email esiste, riceverai le istruzioni per reimpostare la password.'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
