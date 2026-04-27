import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const provinces = await prisma.province.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ provinces });
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
