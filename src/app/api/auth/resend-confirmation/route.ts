import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendConfirmationEmail } from '@/lib/email';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

async function generateConfirmationToken(userId: string, email: string): Promise<string> {
  return await new SignJWT({ userId, email, purpose: 'email_confirmation' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email obbligatoria' },
        { status: 400 }
      );
    }

    // Find user in KYKOS DB
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: 'Se l\'email esiste, riceverai un\'email di conferma.',
      });
    }

    // Check if already confirmed
    if (user.emailConfirmed) {
      return NextResponse.json({
        message: 'Questa email è già stata confermata. Puoi accedere.',
      });
    }

    // Generate new confirmation token
    const confirmToken = await generateConfirmationToken(user.id, email);

    // Send confirmation email
    const sent = await sendConfirmationEmail(email, user.name, confirmToken);

    if (!sent) {
      return NextResponse.json(
        { error: 'Errore nell\'invio dell\'email. Riprova più tardi.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Email di conferma inviata. Controlla la tua casella di posta.',
    });
  } catch (error) {
    console.error('Resend confirmation error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
