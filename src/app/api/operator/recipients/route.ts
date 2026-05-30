import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hasAnyPermission } from '@/lib/permissions';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

interface OperatorSession {
  operatorId: string;
  organizationId: string;
  username: string;
  role: string;
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

export async function GET(request: Request) {
  try {
    const session = await getOperatorSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const operator = await prisma.operator.findUnique({
      where: { id: session.operatorId },
    });

    if (!operator || !operator.active) {
      return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
    }

    if (!hasAnyPermission(operator.role, operator.permissions, ['RECIPIENT_AUTHORIZE'])) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const isStreet = operator.isStreetOperator;

    if (isStreet) {
      // Get organization to find diocese
      const org = await prisma.organization.findUnique({
        where: { id: session.organizationId },
        select: { dioceseId: true },
      });

      if (!org?.dioceseId) {
        return NextResponse.json({ error: 'Ente non associato a una diocesi' }, { status: 400 });
      }

      // Find all organizations in the same diocese
      const organizationsInDiocese = await prisma.organization.findMany({
        where: { dioceseId: org.dioceseId },
        select: { id: true },
      });

      const orgIds = organizationsInDiocese.map(o => o.id);

      // Search recipients across all organizations in the diocese
      const whereClause: any = {
        role: 'RECIPIENT',
        referenceEntityId: { in: orgIds },
        authorized: true,
      };

      if (query) {
        whereClause.OR = [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { fiscalCode: { contains: query, mode: 'insensitive' } },
          { nickname: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ];
      }

      const recipients = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          nickname: true,
          firstName: true,
          lastName: true,
          fiscalCode: true,
          birthDate: true,
          city: true,
          province: true,
          isStreetManaged: true,
          authorized: true,
          authorizedAt: true,
          needScore: true,
          email: true,
          createdAt: true,
          referenceEntity: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
        orderBy: { lastName: 'asc' },
        take: 50,
      });

      return NextResponse.json({ recipients });
    } else {
      // Office operator - only their organization
      const whereClause: any = {
        role: 'RECIPIENT',
        referenceEntityId: session.organizationId,
        authorized: true,
      };

      if (query) {
        whereClause.OR = [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { fiscalCode: { contains: query, mode: 'insensitive' } },
          { nickname: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ];
      }

      const recipients = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          nickname: true,
          firstName: true,
          lastName: true,
          fiscalCode: true,
          birthDate: true,
          city: true,
          province: true,
          isStreetManaged: true,
          authorized: true,
          authorizedAt: true,
          needScore: true,
          email: true,
          createdAt: true,
          referenceEntity: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
        orderBy: { lastName: 'asc' },
        take: 50,
      });

      return NextResponse.json({ recipients });
    }
  } catch (error) {
    console.error('Operator recipients error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getOperatorSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const operator = await prisma.operator.findUnique({
      where: { id: session.operatorId },
    });

    if (!operator || !operator.active) {
      return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
    }

    if (!hasAnyPermission(operator.role, operator.permissions, ['RECIPIENT_AUTHORIZE'])) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const { recipientId, authorize } = await request.json();

    if (!recipientId) {
      return NextResponse.json({ error: 'recipientId è obbligatorio' }, { status: 400 });
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Ricevente non trovato' }, { status: 404 });
    }

    if (recipient.referenceEntityId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: recipientId },
      data: {
        authorized: authorize,
        authorizedAt: authorize ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Operator recipients PATCH error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
