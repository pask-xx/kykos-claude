import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const {
      firstName,
      lastName,
      fiscalCode,
      birthDate,
      address,
      houseNumber,
      city,
      cap,
      latitude,
      longitude,
    } = await request.json();

    // Validate required fields
    if (!firstName || !lastName || !fiscalCode) {
      return NextResponse.json(
        { error: 'Nome, cognome e codice fiscale sono obbligatori' },
        { status: 400 }
      );
    }

    // Validate fiscal code format (16 characters for Italy)
    if (fiscalCode.length !== 16) {
      return NextResponse.json(
        { error: 'Codice fiscale non valido' },
        { status: 400 }
      );
    }

    // Update user profile
    const user = await prisma.user.update({
      where: { id: session.id },
      data: {
        firstName,
        lastName,
        fiscalCode: fiscalCode.toUpperCase(),
        birthDate: birthDate ? new Date(birthDate) : null,
        address,
        houseNumber,
        city,
        cap,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        name: `${firstName} ${lastName}`, // Update display name
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        fiscalCode: user.fiscalCode,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
