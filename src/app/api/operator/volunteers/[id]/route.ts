import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hasAnyPermission } from '@/lib/permissions';
import { NotificationType, RecipientType, VolunteerStatus } from '@prisma/client';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

interface OperatorSession {
  operatorId: string;
  organizationId: string;
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getOperatorSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // action: 'approve' | 'reject' | 'suspend'

    // Get operator to check permissions
    const operator = await prisma.operator.findUnique({
      where: { id: session.operatorId },
    });

    if (!operator || !hasAnyPermission(operator.role, operator.permissions, ['VOLUNTEER_MANAGE', 'ORGANIZATION_ADMIN'])) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    // Get the volunteer association
    const association = await prisma.volunteerAssociation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    if (!association) {
      return NextResponse.json({ error: 'Associazione non trovata' }, { status: 404 });
    }

    // Verify organization matches
    if (association.organizationId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    let newStatus: VolunteerStatus;
    let notificationTitle: string;
    let notificationMessage: string;

    switch (action) {
      case 'approve':
        newStatus = 'APPROVED';
        notificationTitle = 'Candidatura approvata!';
        notificationMessage = `La tua candidatura come volontario per "${association.organization.name}" è stata approvata. Benvenuto nel team!`;
        break;
      case 'reject':
        newStatus = 'REJECTED';
        notificationTitle = 'Candidatura rifiutata';
        notificationMessage = `Siamo spiacenti, la tua candidatura come volontario per "${association.organization.name}" non è stata accettata.`;
        break;
      case 'suspend':
        newStatus = 'SUSPENDED';
        notificationTitle = 'Associazione sospesa';
        notificationMessage = `La tua attività come volontario per "${association.organization.name}" è stata temporaneamente sospesa.`;
        break;
      default:
        return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
    }

    const updateData: any = { status: newStatus };
    if (action === 'approve') {
      updateData.startDate = new Date();
    }

    await prisma.volunteerAssociation.update({
      where: { id },
      data: updateData,
    });

    // Send notification to user
    await prisma.notification.create({
      data: {
        recipientUserId: association.userId,
        recipientType: RecipientType.USER,
        title: notificationTitle,
        message: notificationMessage,
        type: NotificationType.MESSAGE_FROM_OPERATOR,
        link: '/volunteer/associations',
      },
    });

    return NextResponse.json({ success: true, message: `Volontario ${action === 'approve' ? 'approvato' : action === 'reject' ? 'rifiutato' : 'sospeso'} con successo` });
  } catch (error) {
    console.error('Operator volunteer PATCH error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}