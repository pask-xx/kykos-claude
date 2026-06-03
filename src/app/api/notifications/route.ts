import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { RecipientType } from '@prisma/client';
import { getNotifications, getUnreadCount, markAllAsRead } from '@/lib/notification-service';
import { getJwtSecret } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';

const JWT_SECRET = getJwtSecret();

interface UserSession {
  userId: string;
  role: string;
}

async function getUserSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userPayload = payload.user as { id: string; role: string } | undefined;
    if (!userPayload?.id) return null;
    return { userId: userPayload.id, role: userPayload.role || 'DONOR' };
  } catch {
    return null;
  }
}

export const GET = withErrorHandler(async () => {
  const session = await getUserSession();

  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const notifications = await getNotifications(session.userId, RecipientType.USER);
  const unreadCount = await getUnreadCount(session.userId, RecipientType.USER);

  return NextResponse.json({ notifications, unreadCount });
}, 'GET /api/notifications');

export const PATCH = withErrorHandler(async () => {
  const session = await getUserSession();

  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  await markAllAsRead(session.userId, RecipientType.USER);

  return NextResponse.json({ success: true });
}, 'PATCH /api/notifications');