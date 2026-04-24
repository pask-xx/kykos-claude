import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : 30;

    const intermediaries = await prisma.organization.findMany({
      where: { verified: true },
      select: {
        id: true,
        name: true,
        type: true,
        address: true,
        latitude: true,
        longitude: true,
      },
      orderBy: { name: 'asc' },
    });

    // If lat/lng provided, filter by distance
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      const filtered = intermediaries
        .map(org => ({
          ...org,
          distance: org.latitude && org.longitude
            ? haversineDistance(userLat, userLng, org.latitude, org.longitude)
            : null,
        }))
        .filter(org => org.distance !== null && org.distance <= radius)
        .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

      return NextResponse.json({ intermediaries: filtered });
    }

    return NextResponse.json({ intermediaries });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
