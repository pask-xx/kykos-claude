import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'RECIPIENT') {
      return NextResponse.json({ error: 'Solo i riceventi possono fare richieste' }, { status: 403 });
    }

    // Get recipient's organization and authorization status
    const recipient = await prisma.user.findUnique({
      where: { id: session.id },
      select: { referenceEntityId: true, authorized: true },
    });

    if (!recipient?.referenceEntityId) {
      return NextResponse.json({ objects: [], nextCursor: null });
    }

    if (!recipient.authorized) {
      return NextResponse.json({ objects: [], nextCursor: null, unauthorized: true });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Get objects already requested by this recipient
    const requestedObjectIds = await prisma.request.findMany({
      where: { recipientId: session.id },
      select: { objectId: true },
    }).then(rows => rows.map(r => r.objectId));

    const objects = await prisma.object.findMany({
      where: {
        status: 'AVAILABLE',
        intermediaryId: recipient.referenceEntityId,
        NOT: { id: { in: requestedObjectIds } },
      },
      include: {
        donor: {
          select: {
            donorProfile: {
              select: { level: true }
            }
          }
        },
        _count: {
          select: { requests: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Fetch one extra to determine if there's a next page
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    // Determine if there are more results
    const hasNextPage = objects.length > limit;
    const items = hasNextPage ? objects.slice(0, -1) : objects;
    const nextCursor = hasNextPage ? items[items.length - 1]?.id : null;

    return NextResponse.json({
      objects: items,
      nextCursor,
      hasNextPage,
    });
  } catch (error) {
    console.error('Error fetching objects:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}