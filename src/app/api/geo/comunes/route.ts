import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const provinceSigla = searchParams.get('province');

    if (!provinceSigla) {
      return NextResponse.json(
        { error: 'Parametro province obbligatorio' },
        { status: 400 }
      );
    }

    const comuni = await prisma.comune.findMany({
      where: { provinceSigla },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ comuni });
  } catch (error) {
    console.error('Error fetching comuni:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
