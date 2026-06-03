import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hasPermission, hasAnyPermission } from '@/lib/permissions';
import { getJwtSecret } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';

const JWT_SECRET = getJwtSecret();

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

export const GET = withErrorHandler(async () => {

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

  // Check permission
  if (!hasAnyPermission(operator.role, operator.permissions, ['OBJECT_RECEIVE', 'OBJECT_DELIVER'])) {
    return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
  }

  // Se è street operator, vede TUTTI gli oggetti della diocesi
  // Altrimenti vede solo gli oggetti del proprio ente
  let whereClause: any = {};

  if (operator.isStreetOperator && !operator.isOfficeOperator) {
    // Solo street operator: visibilità diocesana
    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      select: { dioceseId: true },
    });

    if (org?.dioceseId) {
      whereClause = {
        intermediary: {
          dioceseId: org.dioceseId,
        },
      };
    }
  } else {
    // Operatore d'ufficio o misto: solo proprio ente
    whereClause = { intermediaryId: session.organizationId };
  }

  const objects = await prisma.object.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      condition: true,
      status: true,
      imageUrls: true,
      createdAt: true,
      depositLocation: true,
      donor: { select: { id: true, nickname: true, name: true } },
      requests: {
        where: { status: 'APPROVED' },
        select: {
          id: true,
          recipient: { select: { id: true, nickname: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ objects });

}, 'GET /api/operator/objects');
