import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'INTERMEDIARY') {
      return NextResponse.json({ error: 'Solo gli intermediari possono aggiornare i dati dell\'organizzazione' }, { status: 403 });
    }

    const { latitude, longitude } = await request.json();

    // Get organization by userId
    const org = await prisma.organization.findUnique({
      where: { userId: session.id },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
    }

    // Update organization
    const updated = await prisma.organization.update({
      where: { id: org.id },
      data: {
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      },
    });

    return NextResponse.json({ success: true, organization: updated });
  } catch (error) {
    console.error('Organization update error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
