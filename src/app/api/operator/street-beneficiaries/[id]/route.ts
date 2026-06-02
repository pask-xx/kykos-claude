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

    // Find beneficiary: must be RECIPIENT, isStreetManaged, and has at least one street operator assigned
    // (authorization: operator must be among the assigned ones)
    const beneficiary = await prisma.user.findFirst({
      where: {
        id,
        role: 'RECIPIENT',
        isStreetManaged: true,
        managedByStreetOperators: {
          some: {
            streetOperatorId: session.operatorId,
          },
        },
      },
      select: {
        id: true,
        email: true,
        authUserId: true,
        emailConfirmed: true,
        nickname: true,
        needScore: true,
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
        isStreetManaged: true,
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

// PATCH /api/operator/street-beneficiaries/[id] - aggiorna un beneficiario
export async function PATCH(
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
    const body = await request.json();

    // Verify beneficiary exists and is managed by this operator
    const existing = await prisma.user.findFirst({
      where: {
        id,
        role: 'RECIPIENT',
        isStreetManaged: true,
        managedByStreetOperators: {
          some: {
            streetOperatorId: session.operatorId,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Beneficiario non trovato' }, { status: 404 });
    }

    // Validate email format if provided (not required, but if provided must be valid)
    if (body.email !== undefined && body.email !== null && body.email !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json({ error: 'Formato email non valido' }, { status: 400 });
      }
      // Reject placeholder emails
      if (body.email.includes('@street.kykos.local') ||
          body.email.includes('@placeholder') ||
          body.email.startsWith('street.')) {
        return NextResponse.json({ error: 'Email non valida. Inserisci una email reale.' }, { status: 400 });
      }
      // Check if email is already used by another user
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: body.email,
          id: { not: id },
        },
      });
      if (existingEmail) {
        return NextResponse.json({ error: 'Email già utilizzata da un altro utente' }, { status: 400 });
      }
    }

    // Build update data - only include fields that are provided
    const updateData: Record<string, any> = {};

    if (body.email !== undefined) updateData.email = body.email;
    if (body.nickname !== undefined) updateData.nickname = body.nickname;
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.fiscalCode !== undefined) updateData.fiscalCode = body.fiscalCode;
    if (body.birthDate !== undefined) updateData.birthDate = body.birthDate ? new Date(body.birthDate) : null;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.houseNumber !== undefined) updateData.houseNumber = body.houseNumber;
    if (body.cap !== undefined) updateData.cap = body.cap;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.province !== undefined) updateData.province = body.province;
    if (body.isee !== undefined) updateData.isee = body.isee;
    if (body.needScore !== undefined) updateData.needScore = body.needScore;
    if (body.latitude !== undefined) updateData.latitude = body.latitude ? parseFloat(body.latitude) : null;
    if (body.longitude !== undefined) updateData.longitude = body.longitude ? parseFloat(body.longitude) : null;

    // Update beneficiary
    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ beneficiary: updated });
  } catch (error) {
    console.error('Street beneficiary PATCH error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
