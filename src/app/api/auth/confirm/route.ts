import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { createSession, setSessionCookie } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token mancante' },
        { status: 400 }
      );
    }

    // Verify the token
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
    if ((payload as any).purpose !== 'email_confirmation') {
      return NextResponse.json(
        { error: 'Token non valido per questo uso' },
        { status: 400 }
      );
    }

    const userId = (payload as any).userId;
    const email = (payload as any).email;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Token non valido' },
        { status: 400 }
      );
    }

    // Find user in KYKOS DB by authUserId (Supabase Auth user ID from token)
    const user = await prisma.user.findFirst({
      where: { authUserId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      );
    }

    // Check if already confirmed
    if (user.emailConfirmed) {
      return NextResponse.json(
        { error: 'Email già confermata' },
        { status: 400 }
      );
    }

    // Mark email as confirmed (authorized stays false - only INTERMEDIARY can set it)
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailConfirmed: true,
        emailConfirmedAt: new Date(),
      },
    });

    // Send welcome email
    const userRole = user.role as 'DONOR' | 'RECIPIENT' | 'INTERMEDIARY';
    sendWelcomeEmail(user.email, user.name, userRole).catch(err => {
      console.error('Failed to send welcome email:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Email confermata con successo',
    });
  } catch (error) {
    console.error('Confirm email error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
