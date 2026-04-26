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

  return prisma.notification.create({
    data: {
      recipientId,
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

export async function getNotifications(recipientId: string, recipientType: RecipientType) {
  return prisma.notification.findMany({
    where: { recipientId, recipientType },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getUnreadCount(recipientId: string, recipientType: RecipientType) {
  return prisma.notification.count({
    where: { recipientId, recipientType, read: false },
  });
}

export async function markAsRead(notificationId: string, recipientId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, recipientId },
    data: { read: true },
  });
}

export async function markAllAsRead(recipientId: string, recipientType: RecipientType) {
  return prisma.notification.updateMany({
    where: { recipientId, recipientType, read: false },
    data: { read: true },
  });
}

export async function deleteNotification(notificationId: string, recipientId: string) {
  return prisma.notification.deleteMany({
    where: { id: notificationId, recipientId },
  });
}