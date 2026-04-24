import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Only intermediary users can create operators
    if (session.role !== 'INTERMEDIARY') {
      return NextResponse.json(
        { error: 'Solo gli intermediari possono creare operatori' },
        { status: 403 }
      );
    }

    const {
      username,
      email,
      phone,
      firstName,
      lastName,
      password,
      role,
    } = await request.json();

    // Validate required fields
    if (!username || !firstName || !lastName || !password) {
      return NextResponse.json(
        { error: 'Username, nome, cognome e password sono obbligatori' },
        { status: 400 }
      );
    }

    // Get organization for current user
    const organization = await prisma.organization.findUnique({
      where: { userId: session.id },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organizzazione non trovata' },
        { status: 404 }
      );
    }

    // Check if username already exists in this organization
    const existing = await prisma.operator.findUnique({
      where: {
        organizationId_username: {
          organizationId: organization.id,
          username: username,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Username già esistente in questa organizzazione' },
        { status: 400 }
      );
    }

    // Create operator
    const operator = await prisma.operator.create({
      data: {
        username,
        email: email || null,
        phone: phone || null,
        firstName,
        lastName,
        passwordHash: await hashPassword(password),
        role: role || 'OPERATORE',
        organizationId: organization.id,
      },
    });

    return NextResponse.json({
      operator: {
        id: operator.id,
        username: operator.username,
        email: operator.email,
        phone: operator.phone,
        firstName: operator.firstName,
        lastName: operator.lastName,
        role: operator.role,
        active: operator.active,
      },
    });
  } catch (error) {
    console.error('Operator register error:', error);
    return NextResponse.json(
      { error: 'Errore interno' },
      { status: 500 }
    );
  }
}
