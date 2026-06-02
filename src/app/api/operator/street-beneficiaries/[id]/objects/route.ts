import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { getJwtSecret } from '@/lib/auth';

const JWT_SECRET = getJwtSecret();

interface OperatorSession {
  operatorId: string;
  organizationId: string;
  username: string;
  role: string;
  isStreetOperator: boolean;
  isOfficeOperator: boolean;
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

// Ordine di priorità per Object.status (dal documento statiPrioritaBeniDisponibilita.md)
const OBJECT_STATUS_PRIORITY: Record<string, number> = {
  DEPOSITED: 100,
  RESERVED: 70,
  AVAILABLE: 60,
  DONATED: 20,
  CANCELLED: 10,
};

// GET /api/operator/street-beneficiaries/[id]/objects - lista oggetti/disponibilita per beneficiario street
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getOperatorSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (!session.isStreetOperator) {
      return NextResponse.json({ error: 'Solo operatori di strada' }, { status: 403 });
    }

    const { id: beneficiaryId } = await params;

    // Verify beneficiary exists and is street-managed by this operator
    const beneficiary = await prisma.user.findFirst({
      where: {
        id: beneficiaryId,
        role: 'RECIPIENT',
        isStreetManaged: true,
        managedByStreetOperators: {
          some: {
            streetOperatorId: session.operatorId,
          },
        },
      },
    });

    if (!beneficiary) {
      return NextResponse.json(
        { error: 'Beneficiario non trovato o non gestito da te' },
        { status: 404 }
      );
    }

    // Fetch Request (Object donations) for this beneficiary
    // Status: DEPOSITED, RESERVED, AVAILABLE, DONATED, CANCELLED
    const objectRequests = await prisma.request.findMany({
      where: {
        recipientId: beneficiaryId,
        object: {
          status: { in: ['DEPOSITED', 'RESERVED', 'AVAILABLE', 'DONATED', 'CANCELLED'] },
        },
      },
      include: {
        object: {
          select: {
            id: true,
            title: true,
            category: true,
            condition: true,
            status: true,
            imageUrls: true,
            depositLocation: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch GoodsRequest (Richieste di beni/servizi) for this beneficiary with offers
    const goodsRequests = await prisma.goodsRequest.findMany({
      where: {
        beneficiaryId,
        status: { in: ['PENDING', 'APPROVED', 'FULFILLED', 'DELIVERED', 'COMPLETED', 'CANCELLED'] },
      },
      include: {
        offers: {
          where: { status: { in: ['PENDING', 'ACCEPTED', 'REJECTED'] } },
          include: {
            offeredBy: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build unified list with type discriminator
    const items: Array<{
      id: string;
      type: 'OBJECT' | 'GOODS';
      title: string;
      category: string;
      condition?: string;
      status: string;
      statusLabel: string;
      priority: number;
      imageUrls: string[];
      depositLocation?: string | null;
      objectId?: string;
      createdAt: Date;
      qrLink?: string;
      offers?: Array<{
        id: string;
        message: string | null;
        status: string;
        imageUrls: string[];
        offeredBy: { id: string; name: string };
        createdAt: Date;
      }>;
    }> = [];

    // Object requests
    for (const req of objectRequests) {
      const objStatus = req.object.status as string;
      items.push({
        id: req.id,
        type: 'OBJECT',
        title: req.object.title,
        category: req.object.category,
        condition: req.object.condition,
        status: objStatus,
        statusLabel: getObjectStatusLabel(objStatus),
        priority: OBJECT_STATUS_PRIORITY[objStatus] ?? 0,
        imageUrls: req.object.imageUrls || [],
        depositLocation: req.object.depositLocation,
        objectId: req.object.id,
        createdAt: req.createdAt,
        qrLink: objStatus === 'DEPOSITED' ? `/operator/scan-qr/pickup/${req.id}` : undefined,
      });
    }

    // Goods requests
    for (const gr of goodsRequests) {
      items.push({
        id: gr.id,
        type: 'GOODS',
        title: gr.title,
        category: gr.category,
        status: gr.status,
        statusLabel: getGoodsStatusLabel(gr.status),
        priority: getGoodsPriority(gr.status),
        imageUrls: [],
        createdAt: gr.createdAt,
        qrLink: gr.status === 'DELIVERED' ? `/operator/goods-pickup-qr/${gr.id}` : undefined,
        offers: gr.offers.map(o => ({
          id: o.id,
          message: o.message,
          status: o.status,
          imageUrls: o.imageUrls || [],
          offeredBy: { id: o.offeredBy.id, name: o.offeredBy.name },
          createdAt: o.createdAt,
        })),
      });
    }

    // Sort by priority desc, then by createdAt desc
    items.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Street beneficiary objects GET error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

function getObjectStatusLabel(status: string): string {
  switch (status) {
    case 'DEPOSITED': return 'Depositata';
    case 'RESERVED': return 'Riservata';
    case 'AVAILABLE': return 'Disponibile';
    case 'DONATED': return 'Ritirata';
    case 'CANCELLED': return 'Cancellata';
    default: return status;
  }
}

function getGoodsStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING': return 'In attesa';
    case 'APPROVED': return 'Approvata';
    case 'FULFILLED': return 'Soddisfatta';
    case 'DELIVERED': return 'Depositata';
    case 'COMPLETED': return 'Completata';
    case 'CANCELLED': return 'Cancellata';
    default: return status;
  }
}

function getGoodsPriority(status: string): number {
  switch (status) {
    case 'DELIVERED': return 100;
    case 'FULFILLED': return 70;
    case 'PENDING': return 80;
    case 'APPROVED': return 50;
    case 'COMPLETED': return 20;
    case 'CANCELLED': return 10;
    default: return 0;
  }
}