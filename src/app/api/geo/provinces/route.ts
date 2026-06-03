import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api';

export const GET = withErrorHandler(async () => {
  const provinces = await prisma.province.findMany({
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ provinces });
}, 'GET /api/geo/provinces');
