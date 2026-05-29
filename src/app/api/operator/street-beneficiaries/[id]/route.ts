import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

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

    const { id } = await params;

    const beneficiary = await prisma.user.findFirst({
      where: {
        id,
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
      select: {
        id: true,
        nickname: true,
        firstName: true,
        lastName: true,
        fiscalCode: true,
birthDate: true,
        address: true,
        houseNumber: true,
        cap: true,
        city: true,
        province: true,
        isee: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        referenceEntity: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    });

    if (!beneficiary) {
      return NextResponse.json({ error: 'Beneficiario non trovato' }, { status: 404 });
    }

    return NextResponse.json({ beneficiary });
  } catch (error) {
    console.error('Street beneficiary GET error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
