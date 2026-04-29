import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/geo';

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
      select: { latitude: true, longitude: true },
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