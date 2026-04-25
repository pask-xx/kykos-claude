import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

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

    // Get operator
    const operator = await prisma.operator.findUnique({
      where: { id },
    });

    if (!operator || operator.organizationId !== organization.id) {
      return NextResponse.json(
        { error: 'Operatore non trovato' },
        { status: 404 }
      );
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
    return NextResponse.json(
      { error: 'Errore interno' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'INTERMEDIARY') {
      return NextResponse.json(
        { error: 'Solo gli intermediari possono modificare gli operatori' },
        { status: 403 }
      );
    }

    const { id } = await params;

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

    // Get operator to update
    const operator = await prisma.operator.findUnique({
      where: { id },
    });

    if (!operator || operator.organizationId !== organization.id) {
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
    if (password) updateData.passwordHash = await hashPassword(password);

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
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'INTERMEDIARY') {
      return NextResponse.json(
        { error: 'Solo gli intermediari possono eliminare gli operatori' },
        { status: 403 }
      );
    }

    const { id } = await params;

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

    // Get operator to delete
    const operator = await prisma.operator.findUnique({
      where: { id },
    });

    if (!operator || operator.organizationId !== organization.id) {
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
