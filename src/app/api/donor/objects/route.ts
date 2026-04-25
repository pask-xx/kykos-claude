import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'DONOR' && session.role !== 'RECIPIENT') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const objects = await prisma.object.findMany({
      where: { donorId: session.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ objects });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
