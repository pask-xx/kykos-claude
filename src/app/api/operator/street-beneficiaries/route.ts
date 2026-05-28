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

// GET /api/operator/street-beneficiaries - lista beneficiari assegnati allo street operator
export async function GET() {
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

    if (!operator.isStreetOperator) {
      return NextResponse.json({ error: 'Non è un operatore di strada' }, { status: 403 });
    }

    // Trova i beneficiari assegnati a questo street operator
    const assignments = await prisma.streetOperatorBeneficiary.findMany({
      where: { streetOperatorId: session.operatorId },
      include: {
        beneficiary: {
          select: {
            id: true,
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
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    const beneficiaries = assignments.map(a => ({
      ...a.beneficiary,
      assignedAt: a.assignedAt,
    }));

    return NextResponse.json({ beneficiaries });
  } catch (error) {
    console.error('Street beneficiaries error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// POST /api/operator/street-beneficiaries - crea un nuovo beneficiario street-managed
export async function POST(request: Request) {
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

    if (!operator.isStreetOperator) {
      return NextResponse.json({ error: 'Non è un operatore di strada' }, { status: 403 });
    }

    const {
      nickname,
      firstName,
      lastName,
      fiscalCode,
      birthDate,
      address,
      houseNumber,
      cap,
      city,
      province,
      latitude,
      longitude,
      isee,
    } = await request.json();

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'Nome e cognome sono obbligatori' }, { status: 400 });
    }

    // Crea il beneficiario senza account
    const beneficiary = await prisma.user.create({
      data: {
        email: `street.${Date.now()}@street.kykos.local`,
        nickname: nickname || null,
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        fiscalCode,
        birthDate: birthDate ? new Date(birthDate) : null,
        address,
        houseNumber,
        cap,
        city,
        province,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        isee: isee ? parseFloat(isee) : null,
        role: 'RECIPIENT',
        isStreetManaged: true,
        authorized: true, // Pre-approvato come delegato dell'ente
        referenceEntityId: session.organizationId,
      },
    });

    // Associa subito questo street operator al beneficiario
    await prisma.streetOperatorBeneficiary.create({
      data: {
        streetOperatorId: session.operatorId,
        beneficiaryId: beneficiary.id,
      },
    });

    return NextResponse.json({
      beneficiary: {
        id: beneficiary.id,
        firstName: beneficiary.firstName,
        lastName: beneficiary.lastName,
        email: beneficiary.email,
        address: beneficiary.address,
        city: beneficiary.city,
        isStreetManaged: beneficiary.isStreetManaged,
        createdAt: beneficiary.createdAt,
      },
    });
  } catch (error) {
    console.error('Create street beneficiary error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}