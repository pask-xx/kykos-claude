import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { Category, NotificationType, RecipientType, RequestType, GoodsRequestStatus } from '@prisma/client';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

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

export async function POST(request: Request) {
  try {
    const session = await getOperatorSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (!session.isStreetOperator) {
      return NextResponse.json({ error: 'Solo operatori di strada' }, { status: 403 });
    }

    const { beneficiaryId, title, category, type, description } = await request.json();

    if (!beneficiaryId || !title || !category) {
      return NextResponse.json(
        { error: 'Beneficiario, titolo e categoria sono obbligatori' },
        { status: 400 }
      );
    }

    // Verify the beneficiary exists and is street-managed
    const beneficiary = await prisma.user.findFirst({
      where: {
        id: beneficiaryId,
        role: 'RECIPIENT',
        isStreetManaged: true,
        referenceEntity: {
          operators: {
            some: {
              id: session.operatorId,
              active: true,
            },
          },
        },
      },
      include: {
        referenceEntity: true,
      },
    });

    if (!beneficiary) {
      return NextResponse.json(
        { error: 'Beneficiario non trovato o non gestito da te' },
        { status: 404 }
      );
    }

    if (!beneficiary.referenceEntityId || !beneficiary.referenceEntity) {
      return NextResponse.json(
        { error: 'Beneficiario senza ente di riferimento' },
        { status: 400 }
      );
    }

    const requestType = type === 'SERVICES' ? 'SERVICES' : 'GOODS';

    // Street operator requests are auto-approved (same as other street operator actions)
    const entityRequest = await prisma.goodsRequest.create({
      data: {
        title,
        category: category as Category,
        type: requestType,
        description,
        beneficiaryId,
        intermediaryId: beneficiary.referenceEntityId,
        status: GoodsRequestStatus.APPROVED, // Auto-approved for street operators
      },
      include: {
        beneficiary: { select: { nickname: true, name: true } },
        intermediary: { select: { name: true } },
      },
    });

    // Notify operators of the entity about the new request
    const operators = await prisma.operator.findMany({
      where: {
        organizationId: beneficiary.referenceEntityId,
        active: true,
      },
      select: { id: true },
    });

    const typeLabel = requestType === 'GOODS' ? 'beni' : 'servizi';

    for (const op of operators) {
      await prisma.notification.create({
        data: {
          recipientOperatorId: op.id,
          recipientType: RecipientType.OPERATOR,
          title: `Nuova richiesta ${typeLabel} per beneficiario street`,
          message: `${session.username} ha creato una richiesta di ${typeLabel} per @{beneficiary.nickname}: "${title}"`,
          type: NotificationType.GOODS_REQUEST_CREATED,
          link: `/operator/requests-entity/${entityRequest.id}`,
        },
      });
    }

    return NextResponse.json({ entityRequest }, { status: 201 });
  } catch (error) {
    console.error('Street beneficiary requests POST error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
