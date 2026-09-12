// =============================================================
// GET /api/recipient/fresh-events/templates
// Lista template del proprio ente (con flag isSubscribed).
// =============================================================

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api';

export const GET = withErrorHandler(async () => {
  const session = await getSession();

  if (!session || session.role !== 'RECIPIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { referenceEntityId: true },
  });

  if (!user?.referenceEntityId) {
    return NextResponse.json({ templates: [] });
  }

  const templates = await prisma.freshEventTemplate.findMany({
    where: {
      organizationId: user.referenceEntityId,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      title: true,
      description: true,
      weekday: true,
      startTime: true,
      endTime: true,
      capacity: true,
      defaultPickupInstructions: true,
      isActive: true,
      defaultLocation: {
        select: {
          id: true,
          address: true,
          city: true,
        },
      },
      subscriptions: {
        where: { beneficiaryId: session.id },
        select: { id: true, active: true },
        take: 1,
      },
      // Conta slot futuri pubblicati per questo template
      _count: {
        select: {
          slots: {
            where: {
              status: { in: ['PUBLISHED', 'FULL'] },
              scheduledStart: { gt: new Date() },
            },
          },
        },
      },
    },
    orderBy: { weekday: 'asc' },
  });

  const result = templates.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    weekday: t.weekday,
    startTime: t.startTime,
    endTime: t.endTime,
    capacity: t.capacity,
    defaultPickupInstructions: t.defaultPickupInstructions,
    isActive: t.isActive,
    defaultLocation: t.defaultLocation,
    isSubscribed: t.subscriptions.length > 0 && t.subscriptions[0].active,
    upcomingSlotsCount: t._count.slots,
  }));

  return NextResponse.json({ templates: result });
}, 'GET /api/recipient/fresh-events/templates');
