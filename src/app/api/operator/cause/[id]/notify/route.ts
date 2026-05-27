import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getOperatorSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const operator = await prisma.operator.findUnique({
      where: { id: session.operatorId },
    });

    if (!operator || !operator.active) {
      return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
    }

    const cause = await prisma.cause.findUnique({
      where: { id },
      include: {
        organization: true,
        participants: {
          include: { user: true },
        },
      },
    });

    if (!cause) {
      return NextResponse.json({ error: 'Causa non trovata' }, { status: 404 });
    }

    if (cause.organizationId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const { message, sendEmail: shouldSendEmail } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Messaggio obbligatorio' }, { status: 400 });
    }

    const notificationTitle = `Messaggio sulla causa: ${cause.title}`;

    // Invia notifica e email a ogni partecipante
    for (const participant of cause.participants) {
      const user = participant.user;

      // Notifica in-app
      await prisma.notification.create({
        data: {
          title: notificationTitle,
          message: message.trim(),
          type: 'CAUSE_MESSAGE',
          recipientType: 'USER',
          recipientUserId: user.id,
          link: `/causes/${cause.id}`,
        },
      });

      // Email se richiesto
      if (shouldSendEmail && user.email) {
        await sendEmail({
          to: user.email,
          subject: notificationTitle,
          html: `
            <h2>${notificationTitle}</h2>
            <p>${message.trim().replace(/\n/g, '<br>')}</p>
            <hr>
            <p><strong>Causa:</strong> ${cause.title}</p>
            <p><strong>Ente:</strong> ${cause.organization.name}</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/causes/${cause.id}">Vedi la causa</a></p>
          `,
        });
      }
    }

    return NextResponse.json({ success: true, sent: cause.participants.length });
  } catch (error) {
    console.error('Cause notify error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
