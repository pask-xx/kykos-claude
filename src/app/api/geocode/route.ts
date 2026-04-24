import { NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/geocode';

export async function POST(request: Request) {
  try {
    const { address, city, province, cap } = await request.json();

    if (!address || !city) {
      return NextResponse.json(
        { error: 'Indirizzo e città sono obbligatori' },
        { status: 400 }
      );
    }

    const result = await geocodeAddress(address, city, cap || '', province || '');

    if (!result) {
      return NextResponse.json(
        { error: 'Impossibile trovare le coordinate per questo indirizzo' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      latitude: result.latitude,
      longitude: result.longitude,
      formattedAddress: result.formattedAddress,
    });
  } catch (error) {
    console.error('Geocode API error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
