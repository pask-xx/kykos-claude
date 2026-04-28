import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { RecipientType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getNotifications, getUnreadCount, markAllAsRead, createNotification } from '@/lib/notification-service';
import { hasAnyPermission } from '@/lib/permissions';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

interface OperatorSession {
  operatorId: string;
  organizationId: string;
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

export async function GET() {
  try {
    const session = await getOperatorSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const notifications = await getNotifications(session.operatorId, RecipientType.OPERATOR);
    const unreadCount = await getUnreadCount(session.operatorId, RecipientType.OPERATOR);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Operator notifications GET error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const session = await getOperatorSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    await markAllAsRead(session.operatorId, RecipientType.OPERATOR);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Operator notifications PATCH error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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

    if (!hasAnyPermission(operator.role, operator.permissions, ['RECIPIENT_AUTHORIZE'])) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const { recipientId, recipientType, title, message, link } = await request.json();

    if (!recipientId || !recipientType || !title || !message) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 });
    }

    if (!['USER', 'OPERATOR'].includes(recipientType)) {
      return NextResponse.json({ error: 'Tipo destinatario non valido' }, { status: 400 });
    }

    await createNotification({
      recipientId,
      recipientType: recipientType as RecipientType,
      title,
      message,
      type: 'MESSAGE_FROM_OPERATOR',
      link,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Operator notifications POST error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}