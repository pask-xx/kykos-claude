import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'DONOR') {
      return NextResponse.json({ error: 'Solo i donatori possono vedere le richieste' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Get donor's canProvideServices flag
    const donor = await prisma.user.findUnique({
      where: { id: session.id },
      select: { canProvideServices: true },
    });

    // Build filter for request types
    const typeFilter = donor?.canProvideServices
      ? {} // Show both GOODS and SERVICES
      : { type: 'GOODS' as const }; // Only show GOODS

    // Get IDs of requests the donor already has offers on (to show differently)
    const existingOffers = await prisma.goodsOffer.findMany({
      where: { offeredById: session.id },
      select: { requestId: true },
    });
    const offeredRequestIds = existingOffers.map(o => o.requestId);

    const requests = await prisma.goodsRequest.findMany({
      where: {
        status: 'APPROVED',
        fulfilledById: null,
        beneficiaryId: { not: session.id },
        ...typeFilter,
      },
      include: {
        beneficiary: {
          select: { id: true }, // Just need ID, no personal data (anonymity)
        },
        intermediary: {
          select: { id: true, name: true },
        },
        _count: {
          select: { offers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    // Determine if there are more results
    const hasNextPage = requests.length > limit;
    const items = hasNextPage ? requests.slice(0, -1) : requests;
    const nextCursor = hasNextPage ? items[items.length - 1]?.id : null;

    // Map to add offer status (whether donor already made an offer)
    const mappedRequests = items.map(req => ({
      ...req,
      alreadyOffered: offeredRequestIds.includes(req.id),
      // Don't include beneficiary ID for anonymity
      beneficiaryId: undefined,
    }));

    return NextResponse.json({
      requests: mappedRequests,
      nextCursor,
      hasNextPage,
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}