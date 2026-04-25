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

    const org = await prisma.organization.findUnique({
      where: { userId: session.id },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
    }

    const objects = await prisma.object.findMany({
      where: { intermediaryId: org.id },
      orderBy: { createdAt: 'desc' },
      include: {
        donor: { select: { name: true, firstName: true, lastName: true } },
        _count: {
          select: { requests: true },
        },
      },
    });

    return NextResponse.json({ objects, organizationName: org.name });
  } catch (error) {
    console.error('Intermediary objects error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}