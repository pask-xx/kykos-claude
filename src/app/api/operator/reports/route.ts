import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { NotificationType, RecipientType } from '@prisma/client';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

interface OperatorSession {
  operatorId: string;
  organizationId: string;
  username: string;
  role: string;
}

async function getOperatorSession(): Promise<OperatorSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('operator_session')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as OperatorSession;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const session = await getOperatorSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const reports = await prisma.report.findMany({
      where: { intermediaryId: session.organizationId },
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
    console.error('Operator reports error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getOperatorSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { reportId, action } = await request.json();

    if (!reportId || !action) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report || report.intermediaryId !== session.organizationId) {
      return NextResponse.json({ error: 'Segnalazione non trovata' }, { status: 404 });
    }

    if (action === 'resolve') {
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'RESOLVED' },
      });

      // Notify reporter that report was resolved
      await prisma.notification.create({
        data: {
          recipientUserId: report.reporterId,
          recipientType: RecipientType.USER,
          title: 'Segnalazione risolta',
          message: `La tua segnalazione è stata gestita dall'ente. La ringraziamo per averci aiutato a migliorare il servizio.`,
          type: NotificationType.REPORT_RESOLVED,
          link: '/recipient/dashboard',
        },
      });
    } else if (action === 'dismiss') {
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'DISMISSED' },
      });
    } else if (action === 'block_object') {
      await prisma.object.update({
        where: { id: report.objectId },
        data: { status: 'BLOCKED' },
      });
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'RESOLVED' },
      });
    } else {
      return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Operator reports PATCH error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}