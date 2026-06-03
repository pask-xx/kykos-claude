import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/geo';
import { withErrorHandler } from '@/lib/api';

export const GET = withErrorHandler(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || '50'; // km default

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'Latitudine e longitudine richieste' },
      { status: 400 }
    );
  }

  const centerLat = parseFloat(lat);
  const centerLon = parseFloat(lng);
  const radiusKm = parseFloat(radius);

  // Get all dioceses and calculate distance
  const allDioceses = await prisma.diocese.findMany();

  const diocesesWithDistance = allDioceses
    .map((d) => ({
      id: d.id,
      name: d.name,
      seat: d.seat,
      distance: calculateDistance(centerLat, centerLon, d.latitude, d.longitude),
    }))
    .filter((d) => d.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);

  return NextResponse.json({ dioceses: diocesesWithDistance });
}, 'GET /api/dioceses');
