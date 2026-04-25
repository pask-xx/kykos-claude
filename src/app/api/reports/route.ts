import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'RECIPIENT') {
      return NextResponse.json({ error: 'Solo i beneficiari possono segnalare' }, { status: 403 });
    }

    const { objectId, reason } = await request.json();

    if (!objectId || !reason) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    // Verify object exists
    const object = await prisma.object.findUnique({
      where: { id: objectId },
      include: {
        intermediary: { select: { id: true, name: true } },
      },
    });

    if (!object) {
      return NextResponse.json({ error: 'Oggetto non trovato' }, { status: 404 });
    }

    const report = await prisma.report.create({
      data: {
        objectId,
        reporterId: session.id,
        intermediaryId: object.intermediaryId,
        reason,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ report, message: 'Segnalazione inviata' });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        object: { select: { id: true, title: true } },
        reporter: { select: { id: true, name: true, email: true } },
        intermediary: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}