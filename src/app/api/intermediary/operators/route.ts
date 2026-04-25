import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'INTERMEDIARY') {
      return NextResponse.json(
        { error: 'Solo gli intermediari possono visualizzare gli operatori' },
        { status: 403 }
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

    // Get all operators for this organization
    const operators = await prisma.operator.findMany({
      where: { organizationId: organization.id },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ operators });
  } catch (error) {
    console.error('Operators list error:', error);
    return NextResponse.json(
      { error: 'Errore interno' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'INTERMEDIARY') {
      return NextResponse.json(
        { error: 'Solo gli intermediari possono creare operatori' },
        { status: 403 }
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

    const {
      username,
      email,
      phone,
      firstName,
      lastName,
      role,
      permissions,
    } = await request.json();

    // Validate required fields
    if (!username || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'Username, nome, cognome e ruolo sono obbligatori' },
        { status: 400 }
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

    // Create operator with temporary password
    const tempPassword = 'cambiamisubito';
    const passwordHash = await hashPassword(tempPassword);

    const operator = await prisma.operator.create({
      data: {
        username,
        email: email || null,
        phone: phone || null,
        firstName,
        lastName,
        role,
        permissions: permissions || [],
        passwordHash,
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
        permissions: operator.permissions,
        active: operator.active,
      },
      temporaryPassword: tempPassword,
    });
  } catch (error) {
    console.error('Operator create error:', error);
    return NextResponse.json(
      { error: 'Errore interno' },
      { status: 500 }
    );
  }
}
