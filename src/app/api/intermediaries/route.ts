import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const intermediaries = await prisma.organization.findMany({
      where: { verified: true },
      select: {
        id: true,
        name: true,
        type: true,
        address: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ intermediaries });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
