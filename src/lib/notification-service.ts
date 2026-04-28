import { prisma } from '@/lib/prisma';
import { NotificationType, RecipientType } from '@prisma/client';

interface CreateNotificationParams {
  recipientId: string;
  recipientType: RecipientType;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  data?: Record<string, unknown>;
  reportId?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  const { recipientId, recipientType, title, message, type, link, data, reportId } = params;

  if (recipientType === RecipientType.USER) {
    return prisma.notification.create({
      data: {
        recipientUserId: recipientId,
        recipientType,
        title,
        message,
        type,
        link,
        data: data ? JSON.stringify(data) : null,
        reportId,
      },
    });
  } else {
    return prisma.notification.create({
      data: {
        recipientOperatorId: recipientId,
        recipientType,
        title,
        message,
        type,
        link,
        data: data ? JSON.stringify(data) : null,
        reportId,
      },
    });
  }
}

export async function getNotifications(recipientId: string, recipientType: RecipientType) {
  const where = recipientType === RecipientType.USER
    ? { recipientUserId: recipientId }
    : { recipientOperatorId: recipientId };

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getUnreadCount(recipientId: string, recipientType: RecipientType) {
  const where = recipientType === RecipientType.USER
    ? { recipientUserId: recipientId, read: false }
    : { recipientOperatorId: recipientId, read: false };

  return prisma.notification.count({ where });
}

export async function markAsRead(notificationId: string, recipientId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllAsRead(recipientId: string, recipientType: RecipientType) {
  const where = recipientType === RecipientType.USER
    ? { recipientUserId: recipientId, read: false }
    : { recipientOperatorId: recipientId, read: false };

  return prisma.notification.updateMany({
    where,
    data: { read: true },
  });
}

export async function deleteNotification(notificationId: string, recipientId: string) {
  return prisma.notification.deleteMany({
    where: { id: notificationId },
  });
}