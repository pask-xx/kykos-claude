import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (!hasPermission(operator.role, operator.permissions, 'ORGANIZATION_ADMIN')) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const { id } = await params;

    // Get operator
    const targetOperator = await prisma.operator.findUnique({
      where: { id },
    });

    if (!targetOperator || targetOperator.organizationId !== session.organizationId) {
      return NextResponse.json(
        { error: 'Operatore non trovato' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      operator: {
        id: targetOperator.id,
        username: targetOperator.username,
        email: targetOperator.email,
        phone: targetOperator.phone,
        firstName: targetOperator.firstName,
        lastName: targetOperator.lastName,
        role: targetOperator.role,
        permissions: targetOperator.permissions,
        active: targetOperator.active,
        createdAt: targetOperator.createdAt,
        updatedAt: targetOperator.updatedAt,
      },
    });
  } catch (error) {
    console.error('Operator get error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (!hasPermission(operator.role, operator.permissions, 'ORGANIZATION_ADMIN')) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const { id } = await params;

    // Get operator to update
    const targetOperator = await prisma.operator.findUnique({
      where: { id },
    });

    if (!targetOperator || targetOperator.organizationId !== session.organizationId) {
      return NextResponse.json(
        { error: 'Operatore non trovato' },
        { status: 404 }
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
      permissions,
    } = await request.json();

    // Check if new username conflicts with another operator
    if (username && username !== targetOperator.username) {
      const existing = await prisma.operator.findUnique({
        where: { username },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Username già esistente' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (role !== undefined) updateData.role = role;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (password) {
      return NextResponse.json(
        { error: 'La modifica della password non è supportata per questo tipo di account' },
        { status: 400 }
      );
    }

    const updated = await prisma.operator.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      operator: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        phone: updated.phone,
        firstName: updated.firstName,
        lastName: updated.lastName,
        role: updated.role,
        permissions: updated.permissions,
        active: updated.active,
      },
    });
  } catch (error) {
    console.error('Operator update error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
