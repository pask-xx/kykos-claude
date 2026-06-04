import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';

export const GET = withErrorHandler(async () => {

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
      active: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ operators });

}, 'GET /api/operator/');
