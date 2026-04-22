import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calculateDistance } from '@/lib/geo';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const lat = searchParams.get('latitude');
    const lon = searchParams.get('longitude');
    const radius = searchParams.get('radius');

    const where: Record<string, unknown> = {
      status: 'AVAILABLE',
    };

    if (category && category !== 'ALL') {
      where.category = category;
    }

    const objects = await prisma.object.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        donor: {
          select: { name: true, latitude: true, longitude: true },
        },
        intermediary: {
          select: { name: true, latitude: true, longitude: true },
        },
      },
    });

    // Filter by distance if location provided
    let filteredObjects = objects;
    if (lat && lon) {
      const centerLat = parseFloat(lat);
      const centerLon = parseFloat(lon);
      const radiusKm = radius ? parseFloat(radius) : 10;

      filteredObjects = objects.filter((obj) => {
        const objLat = obj.intermediary.latitude || obj.donor.latitude;
        const objLon = obj.intermediary.longitude || obj.donor.longitude;

        if (!objLat || !objLon) return true; // Include if no coordinates

        const distance = calculateDistance(centerLat, centerLon, objLat, objLon);
        return distance <= radiusKm;
      });
    }

    // Add distance to response if location provided
    const objectsWithDistance = filteredObjects.map((obj) => {
      let distance: number | null = null;

      if (lat && lon) {
        const centerLat = parseFloat(lat);
        const centerLon = parseFloat(lon);
        const objLat = obj.intermediary.latitude || obj.donor.latitude;
        const objLon = obj.intermediary.longitude || obj.donor.longitude;

        if (objLat && objLon) {
          distance = calculateDistance(centerLat, centerLon, objLat, objLon);
        }
      }

      return {
        ...obj,
        distance,
      };
    });

    return NextResponse.json({ objects: objectsWithDistance });
  } catch (error) {
    console.error('Error fetching objects:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'DONOR') {
      return NextResponse.json({ error: 'Solo i donatori possono pubblicare oggetti' }, { status: 403 });
    }

    const { title, description, category, condition, imageUrls, intermediaryId } = await request.json();

    if (!title || !category || !condition || !intermediaryId) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 });
    }

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json({ error: 'Almeno una foto è obbligatoria' }, { status: 400 });
    }

    const object = await prisma.object.create({
      data: {
        title,
        description,
        category,
        condition,
        imageUrls,
        donorId: session.id,
        intermediaryId,
        status: 'AVAILABLE',
      },
    });

    // Update donor profile
    await prisma.donorProfile.upsert({
      where: { userId: session.id },
      update: {
        totalObjects: { increment: 1 },
      },
      create: {
        userId: session.id,
        totalObjects: 1,
        level: 'BRONZE',
      },
    });

    return NextResponse.json({ object });
  } catch (error) {
    console.error('Error creating object:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Errore interno del server', details: message },
      { status: 500 }
    );
  }
}
