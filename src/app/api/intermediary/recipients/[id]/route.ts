import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
      return NextResponse.json({ error: 'Solo gli enti possono accedere' }, { status: 403 });
    }

    const { id } = await params;

    // Get organization for this intermediary
    const org = await prisma.organization.findUnique({
      where: { userId: session.id },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
    }

    // Get recipient
    const recipient = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        fiscalCode: true,
        birthDate: true,
        address: true,
        houseNumber: true,
        cap: true,
        city: true,
        province: true,
        latitude: true,
        longitude: true,
        authorized: true,
        authorizedAt: true,
        createdAt: true,
        isee: true,
        referenceEntityId: true,
        _count: {
          select: {
            requests: true,
          },
        },
      },
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Beneficiario non trovato' }, { status: 404 });
    }

    // Verify recipient belongs to this organization
    if (recipient.referenceEntityId !== org.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    return NextResponse.json({ recipient });
  } catch (error) {
    console.error('Intermediary recipient detail error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
