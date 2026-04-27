import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

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
    // Try user session first, then operator session
    const userSession = await getSession();
    const operatorSession = await getOperatorSession();
    const session = userSession || operatorSession;

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Check if user is intermediary or operator with admin permission
    const isIntermediary = userSession?.role === 'INTERMEDIARY';
    const isOperatorAdmin = operatorSession && operatorSession.role === 'ADMIN';

    if (!isIntermediary && !isOperatorAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const { id } = await params;

    // Get organization for current user/operator
    let organizationId: string;
    if (userSession) {
      const organization = await prisma.organization.findUnique({
        where: { userId: userSession.id },
      });
      if (!organization) {
        return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
      }
      organizationId = organization.id;
    } else {
      organizationId = operatorSession!.organizationId;
    }

    // Get operator
    const operator = await prisma.operator.findUnique({
      where: { id },
    });

    if (!operator || operator.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
    }

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
        createdAt: operator.createdAt,
        updatedAt: operator.updatedAt,
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
    // Try user session first, then operator session
    const userSession = await getSession();
    const operatorSession = await getOperatorSession();
    const session = userSession || operatorSession;

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Check if user is intermediary or operator with admin permission
    const isIntermediary = userSession?.role === 'INTERMEDIARY';
    const isOperatorAdmin = operatorSession && operatorSession.role === 'ADMIN';

    if (!isIntermediary && !isOperatorAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const { id } = await params;

    // Get organization for current user/operator
    let organizationId: string;
    if (userSession) {
      const organization = await prisma.organization.findUnique({
        where: { userId: userSession.id },
      });
      if (!organization) {
        return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
      }
      organizationId = organization.id;
    } else {
      organizationId = operatorSession!.organizationId;
    }

    // Get operator to update
    const operator = await prisma.operator.findUnique({
      where: { id },
    });

    if (!operator || operator.organizationId !== organizationId) {
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
      active,
    } = await request.json();

    // Check if new username conflicts with another operator
    if (username && username !== operator.username) {
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
    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (role !== undefined) updateData.role = role;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (active !== undefined) updateData.active = active;
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
        active: updated.active,
      },
    });
  } catch (error) {
    console.error('Operator update error:', error);
    return NextResponse.json(
      { error: 'Errore interno' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Try user session first, then operator session
    const userSession = await getSession();
    const operatorSession = await getOperatorSession();
    const session = userSession || operatorSession;

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Check if user is intermediary or operator with admin permission
    const isIntermediary = userSession?.role === 'INTERMEDIARY';
    const isOperatorAdmin = operatorSession && operatorSession.role === 'ADMIN';

    if (!isIntermediary && !isOperatorAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const { id } = await params;

    // Get organization for current user/operator
    let organizationId: string;
    if (userSession) {
      const organization = await prisma.organization.findUnique({
        where: { userId: userSession.id },
      });
      if (!organization) {
        return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
      }
      organizationId = organization.id;
    } else {
      organizationId = operatorSession!.organizationId;
    }

    // Get operator to delete
    const operator = await prisma.operator.findUnique({
      where: { id },
    });

    if (!operator || operator.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Operatore non trovato' },
        { status: 404 }
      );
    }

    await prisma.operator.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Operator delete error:', error);
    return NextResponse.json(
      { error: 'Errore interno' },
      { status: 500 }
    );
  }
}
