import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api';

export const GET = withErrorHandler(async () => {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { referenceEntityId: true }
  });

  if (!user?.referenceEntityId) {
    return NextResponse.json({ availabilities: [] });
  }

  // Get open multi availabilities for this organization (not expired)
  const now = new Date();
  const availabilities = await prisma.multiAvailability.findMany({
    where: {
      organizationId: user.referenceEntityId,
      status: 'OPEN',
      OR: [
        { deadline: null },
        { deadline: { gt: now } },
      ],
    },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      imageUrls: true,
      availableQty: true,
      assignedQty: true,
      deadline: true,
      createdAt: true,
      _count: {
        select: {
          requests: { where: { status: 'PENDING' } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  // Check if current user already requested each one
  const availabilitiesWithRequestStatus = await Promise.all(
    availabilities.map(async (avail) => {
      const existingRequest = await prisma.multiAvailabilityRequest.findUnique({
        where: {
          multiAvailabilityId_beneficiaryId: {
            multiAvailabilityId: avail.id,
            beneficiaryId: session.id,
          }
        }
      });

      return {
        ...avail,
        hasRequested: !!existingRequest,
        requestStatus: existingRequest?.status || null,
      };
    })
  );

  return NextResponse.json({ availabilities: availabilitiesWithRequestStatus });
}, 'GET /api/recipient/multi-availability');