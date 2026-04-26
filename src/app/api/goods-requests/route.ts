import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { Category, NotificationType, RecipientType } from '@prisma/client';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

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
    return payload as unknown as UserSession;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    let whereClause: any = {};

    if (filter === 'mine') {
      // User's own requests
      whereClause = { beneficiaryId: session.userId };
    } else if (filter === 'available') {
      // Available requests (approved, not fulfilled, not own)
      whereClause = {
        status: 'APPROVED',
        fulfilledById: null,
        beneficiaryId: { not: session.userId },
      };
    } else {
      // All for operators/admins or filter by role
    }

    const requests = await prisma.goodsRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        beneficiary: {
          select: { id: true, name: true, firstName: true, lastName: true },
        },
        intermediary: {
          select: { id: true, name: true },
        },
        fulfilledBy: {
          select: { id: true, name: true },
        },
        offers: {
          include: {
            offeredBy: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Goods requests GET error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { referenceEntity: true },
    });

    if (!user || !user.referenceEntityId) {
      return NextResponse.json({ error: 'Utente non associato a un ente' }, { status: 400 });
    }

    // Check if organization allows goods requests
    if (!user.referenceEntity.canRequestGoods) {
      return NextResponse.json({ error: 'L\'ente non permette richieste di beni' }, { status: 403 });
    }

    const { title, category, description } = await request.json();

    if (!title || !category) {
      return NextResponse.json({ error: 'Titolo e categoria sono obbligatori' }, { status: 400 });
    }

    const goodsRequest = await prisma.goodsRequest.create({
      data: {
        title,
        category: category as Category,
        description,
        beneficiaryId: session.userId,
        intermediaryId: user.referenceEntityId,
        status: 'PENDING',
      },
      include: {
        beneficiary: { select: { name: true } },
        intermediary: { select: { name: true } },
      },
    });

    // Create notification for operators
    const operators = await prisma.operator.findMany({
      where: { organizationId: user.referenceEntityId },
    });

    for (const op of operators) {
      await prisma.notification.create({
        data: {
          recipientId: op.id,
          recipientType: RecipientType.OPERATOR,
          title: 'Nuova richiesta beni',
          message: `${user.name} ha creato una richiesta di beni: "${title}"`,
          type: NotificationType.GOODS_REQUEST_CREATED,
          link: `/operator/goods-requests/${goodsRequest.id}`,
        },
      });
    }

    return NextResponse.json({ goodsRequest }, { status: 201 });
  } catch (error) {
    console.error('Goods requests POST error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}