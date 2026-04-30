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

// GET available organizations for new applications (excluding already associated ones)
export async function GET(request: Request) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const excludeIds = searchParams.get('exclude')?.split(',').filter(Boolean) || [];

    // Verify user has coordinates
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { latitude: true, longitude: true },
    });

    if (!user || !user.latitude || !user.longitude) {
      return NextResponse.json({
        organizations: [],
        message: 'Coordinate non disponibili. Completa il tuo profilo con indirizzo e città.',
      });
    }

    // Get all verified organizations with coordinates
    const whereClause: any = {
      verified: true,
    };

    // Exclude specified organization IDs (already associated)
    if (excludeIds.length > 0) {
      whereClause.id = { notIn: excludeIds };
    }

    const organizations = await prisma.organization.findMany({
      where: whereClause,
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
    console.error('Available organizations GET error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}