import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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

    // Get open multi availabilities for this organization
    const availabilities = await prisma.multiAvailability.findMany({
      where: {
        organizationId: user.referenceEntityId,
        status: 'OPEN',
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
  } catch (error) {
    console.error('Recipient multi availability error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}