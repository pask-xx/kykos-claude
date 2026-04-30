import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/geo';
import { NotificationType, RecipientType } from '@prisma/client';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

interface UserSession {
  userId: string;
  role: string;
}

async function getUserSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userPayload = payload.user as { id: string; role: string } | undefined;
    if (!userPayload?.id) return null;
    return { userId: userPayload.id, role: userPayload.role || 'DONOR' };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const associations = await prisma.volunteerAssociation.findMany({
      where: { userId: session.userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            city: true,
            province: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get user coordinates for distance calculation
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { latitude: true, longitude: true, name: true },
    });

    // Add distance if user has coordinates and organization has coordinates
    const associationsWithDistance = associations.map(assoc => {
      let distance: number | null = null;
      if (user?.latitude && user?.longitude && assoc.organization.latitude && assoc.organization.longitude) {
        distance = calculateDistance(
          user.latitude,
          user.longitude,
          assoc.organization.latitude,
          assoc.organization.longitude
        );
      }
      return { ...assoc, distance };
    });

    return NextResponse.json({ associations: associationsWithDistance });
  } catch (error) {
    console.error('Volunteer associations GET error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const associationId = searchParams.get('id');

    if (!associationId) {
      return NextResponse.json({ error: 'ID associazione obbligatorio' }, { status: 400 });
    }

    // Find the association
    const association = await prisma.volunteerAssociation.findUnique({
      where: { id: associationId },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        user: {
          select: { name: true },
        },
      },
    });

    if (!association) {
      return NextResponse.json({ error: 'Associazione non trovata' }, { status: 404 });
    }

    // Check ownership
    if (association.userId !== session.userId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Only allow withdrawal from APPROVED associations
    if (association.status !== 'APPROVED') {
      return NextResponse.json({
        error: 'Solo le associazioni approvate possono essere ritirate'
      }, { status: 400 });
    }

    // Update status to WITHDRAWN
    await prisma.volunteerAssociation.update({
      where: { id: associationId },
      data: {
        status: 'WITHDRAWN',
        endDate: new Date(),
      },
    });

    // Notify operators of the organization
    const operators = await prisma.operator.findMany({
      where: {
        organizationId: association.organization.id,
        active: true,
      },
      select: { id: true },
    });

    const notifications = operators.map(op => ({
      recipientOperatorId: op.id,
      recipientType: RecipientType.OPERATOR,
      title: 'Volontario ha ritirato disponibilità',
      message: `${association.user.name} ha ritirato la propria disponibilità come volontario presso "${association.organization.name}".`,
      type: NotificationType.NEW_REQUEST,
      link: '/operator/volunteers',
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    return NextResponse.json({
      success: true,
      message: 'Disponibilità ritirata con successo',
    });
  } catch (error) {
    console.error('Volunteer withdraw error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// GET available organizations for new applications (excluding already associated)
export async function POST(request: Request) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, skills, note, cvUrl } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Ente obbligatorio' }, { status: 400 });
    }

    // Validate skills array if provided
    if (skills && !Array.isArray(skills)) {
      return NextResponse.json({ error: 'Skills deve essere un array' }, { status: 400 });
    }

    // Validate CV URL if provided
    if (cvUrl && !cvUrl.startsWith('http')) {
      return NextResponse.json({ error: 'URL CV non valido' }, { status: 400 });
    }

    // Verify user has coordinates for geo-filtering
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { latitude: true, longitude: true, name: true },
    });

    if (!user || !user.latitude || !user.longitude) {
      return NextResponse.json({
        error: 'Coordinate non disponibili. Completa il tuo profilo con indirizzo e città.',
      }, { status: 400 });
    }

    // Verify organization exists and is verified
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, latitude: true, longitude: true, verified: true },
    });

    if (!organization || !organization.verified) {
      return NextResponse.json({ error: 'Ente non valido' }, { status: 400 });
    }

    // Check within 30km radius
    const distance = calculateDistance(
      user.latitude,
      user.longitude,
      organization.latitude!,
      organization.longitude!
    );

    if (distance > 30) {
      return NextResponse.json({
        error: 'L\'ente deve essere nel raggio di 30km',
      }, { status: 400 });
    }

    // Check if association already exists (including existing ones to exclude)
    const existing = await prisma.volunteerAssociation.findUnique({
      where: {
        userId_organizationId: {
          userId: session.userId,
          organizationId,
        },
      },
    });

    if (existing) {
      if (existing.status === 'APPROVED') {
        return NextResponse.json({
          error: 'Sei già volontario di questo ente',
        }, { status: 400 });
      }
      if (existing.status === 'PENDING') {
        return NextResponse.json({
          error: 'Candidatura già in corso per questo ente',
        }, { status: 400 });
      }
      // If rejected or withdrawn, allow re-application
    }

    // Create or update association
    const association = await prisma.volunteerAssociation.upsert({
      where: {
        userId_organizationId: {
          userId: session.userId,
          organizationId,
        },
      },
      update: {
        status: 'PENDING',
        skills: skills || [],
        note,
        cvUrl,
        startDate: null,
        endDate: null,
      },
      create: {
        userId: session.userId,
        organizationId,
        status: 'PENDING',
        skills: skills || [],
        note,
        cvUrl,
      },
    });

    // Notify operators of the organization
    const operators = await prisma.operator.findMany({
      where: {
        organizationId,
        active: true,
      },
      select: { id: true },
    });

    const notifications = operators.map(op => ({
      recipientOperatorId: op.id,
      recipientType: RecipientType.OPERATOR,
      title: 'Nuova candidatura volontario',
      message: `${user.name} si è candidato come volontario per "${organization.name}".${skills && skills.length > 0 ? ` Disponibilità: ${skills.join(', ')}.` : ''}${note ? ` Note: ${note.substring(0, 50)}${note.length > 50 ? '...' : ''}` : ''}`,
      type: NotificationType.NEW_REQUEST,
      link: '/operator/volunteers',
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    return NextResponse.json({
      success: true,
      message: 'Candidatura inviata con successo',
      association,
    });
  } catch (error) {
    console.error('Volunteer apply POST error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}