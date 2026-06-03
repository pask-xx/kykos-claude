import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api';

export const GET = withErrorHandler(async () => {
  const dioceses = await prisma.diocese.findMany({
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ dioceses });
}, 'GET /api/dioceses/all');