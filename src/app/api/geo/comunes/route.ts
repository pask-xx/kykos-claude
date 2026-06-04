import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api';

export const GET = withErrorHandler(async (request: NextRequest) => {
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
}, 'GET /api/geo/comunes');
