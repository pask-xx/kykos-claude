import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { RecipientType } from '@prisma/client';
import { markAsRead } from '@/lib/notification-service';
import { getJwtSecret } from '@/lib/auth';

const JWT_SECRET = getJwtSecret();

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getOperatorSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id: notificationId } = await params;

    await markAsRead(notificationId, session.operatorId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Operator notification mark read error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getOperatorSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id: notificationId } = await params;

    const { prisma } = await import('@/lib/prisma');
    await prisma.notification.deleteMany({
      where: { id: notificationId, recipientOperatorId: session.operatorId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Operator notification delete error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}