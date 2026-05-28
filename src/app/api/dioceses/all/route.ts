import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const dioceses = await prisma.diocese.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ dioceses });
  } catch (error) {
    console.error('Error fetching dioceses:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}