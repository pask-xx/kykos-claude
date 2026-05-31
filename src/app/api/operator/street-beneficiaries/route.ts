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
            isStreetManaged: true,
            latitude: true,
            longitude: true,
            createdAt: true,
            profileImageUrl: true,
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

// PATCH /api/operator/street-beneficiaries - aggiorna un beneficiario
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

    if (!operator.isStreetOperator) {
      return NextResponse.json({ error: 'Non è un operatore di strada' }, { status: 403 });
    }

    const {
      id,
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

    if (!id) {
      return NextResponse.json({ error: 'ID beneficiario richiesto' }, { status: 400 });
    }

    // Verifica che il beneficiario sia assegnato a questo operator
    const assignment = await prisma.streetOperatorBeneficiary.findFirst({
      where: {
        streetOperatorId: session.operatorId,
        beneficiaryId: id,
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Beneficiario non assegnato a questo operatore' }, { status: 403 });
    }

    // Costruisci i dati da aggiornare
    const updateData: any = {};
    if (nickname !== undefined) updateData.nickname = nickname || null;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (fiscalCode !== undefined) updateData.fiscalCode = fiscalCode || null;
    if (birthDate !== undefined) updateData.birthDate = birthDate ? new Date(birthDate) : null;
    if (address !== undefined) updateData.address = address || null;
    if (houseNumber !== undefined) updateData.houseNumber = houseNumber || null;
    if (cap !== undefined) updateData.cap = cap || null;
    if (city !== undefined) updateData.city = city || null;
    if (province !== undefined) updateData.province = province || null;
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
    if (isee !== undefined) updateData.isee = isee ? parseFloat(isee) : null;
    if (firstName || lastName) updateData.name = `${firstName || ''} ${lastName || ''}`.trim();

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      beneficiary: {
        id: updated.id,
        nickname: updated.nickname,
        firstName: updated.firstName,
        lastName: updated.lastName,
        fiscalCode: updated.fiscalCode,
        birthDate: updated.birthDate,
        address: updated.address,
        houseNumber: updated.houseNumber,
        cap: updated.cap,
        city: updated.city,
        province: updated.province,
        latitude: updated.latitude,
        longitude: updated.longitude,
        isee: updated.isee,
      },
    });
  } catch (error) {
    console.error('Update street beneficiary error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}