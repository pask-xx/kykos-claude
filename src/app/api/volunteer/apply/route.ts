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

export async function GET(request: Request) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { latitude: true, longitude: true, city: true },
    });

    if (!user || !user.latitude || !user.longitude) {
      return NextResponse.json({
        organizations: [],
        message: 'Coordinate non disponibili. Completa il tuo profilo con indirizzo e città.',
      });
    }

    // Get all verified organizations with coordinates
    const organizations = await prisma.organization.findMany({
      where: { verified: true },
      select: {
        id: true,
        name: true,
        city: true,
        province: true,
        address: true,
        latitude: true,
        longitude: true,
      },
    });

    // Filter organizations within 30km
    const nearbyOrganizations = organizations
      .filter(org => org.latitude && org.longitude)
      .map(org => ({
        ...org,
        distance: calculateDistance(
          user.latitude!,
          user.longitude!,
          org.latitude!,
          org.longitude!
        ),
      }))
      .filter(org => org.distance <= 30)
      .sort((a, b) => a.distance - b.distance);

    return NextResponse.json({ organizations: nearbyOrganizations });
  } catch (error) {
    console.error('Volunteer apply GET error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, profile, note, cvUrl } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Ente obbligatorio' }, { status: 400 });
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

    // Check if association already exists
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
      // If rejected or suspended, allow re-application
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
        profile,
        note,
        cvUrl,
        startDate: null,
        endDate: null,
      },
      create: {
        userId: session.userId,
        organizationId,
        status: 'PENDING',
        profile,
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
      message: `${user.name} si è candidato come volontario per "${organization.name}".${profile ? ` Profilo: ${profile}.` : ''}${note ? ` Note: ${note.substring(0, 50)}${note.length > 50 ? '...' : ''}` : ''}`,
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