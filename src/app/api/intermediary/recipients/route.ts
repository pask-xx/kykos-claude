import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'INTERMEDIARY') {
      return NextResponse.json({ error: 'Solo gli enti possono accedere' }, { status: 403 });
    }

    // Get organization for this intermediary
    const org = await prisma.organization.findUnique({
      where: { userId: session.id },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
    }

    // Get all users (recipients) that reference this organization
    const recipients = await prisma.user.findMany({
      where: { referenceEntityId: org.id },
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        fiscalCode: true,
        city: true,
        authorized: true,
        authorizedAt: true,
        createdAt: true,
        isee: true,
        _count: {
          select: {
            requests: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ recipients, organizationName: org.name });
  } catch (error) {
    console.error('Intermediary recipients error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'INTERMEDIARY') {
      return NextResponse.json({ error: 'Solo gli enti possono accedere' }, { status: 403 });
    }

    const { recipientId, authorize } = await request.json();

    if (!recipientId) {
      return NextResponse.json({ error: 'ID ricevente obbligatorio' }, { status: 400 });
    }

    // Get organization for this intermediary
    const org = await prisma.organization.findUnique({
      where: { userId: session.id },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
    }

    // Verify recipient belongs to this organization
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Ricevente non trovato' }, { status: 404 });
    }

    if (recipient.referenceEntityId !== org.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: recipientId },
      data: {
        authorized: authorize,
        authorizedAt: authorize ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Intermediary recipients PATCH error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
