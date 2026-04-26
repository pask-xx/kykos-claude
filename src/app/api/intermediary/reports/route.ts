import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'INTERMEDIARY') {
      return NextResponse.json({ error: 'Solo gli enti possono accedere' }, { status: 403 });
    }

    const org = await prisma.organization.findUnique({
      where: { userId: session.id },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
    }

    const reports = await prisma.report.findMany({
      where: { intermediaryId: org.id },
      orderBy: { createdAt: 'desc' },
      include: {
        object: {
          select: {
            id: true,
            title: true,
            imageUrls: true,
            status: true,
          },
        },
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Intermediary reports error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'INTERMEDIARY') {
      return NextResponse.json({ error: 'Solo gli enti possono accedere' }, { status: 403 });
    }

    const org = await prisma.organization.findUnique({
      where: { userId: session.id },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
    }

    const { reportId, action } = await request.json();

    if (!reportId || !action) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    // Verify report belongs to this organization
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report || report.intermediaryId !== org.id) {
      return NextResponse.json({ error: 'Segnalazione non trovata' }, { status: 404 });
    }

    if (action === 'resolve') {
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'RESOLVED' },
      });
    } else if (action === 'dismiss') {
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'DISMISSED' },
      });
    } else if (action === 'block_object') {
      // Block the reported object
      await prisma.object.update({
        where: { id: report.objectId },
        data: { status: 'BLOCKED' },
      });
      // Also mark report as resolved
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'RESOLVED' },
      });
    } else {
      return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Intermediary reports PATCH error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}