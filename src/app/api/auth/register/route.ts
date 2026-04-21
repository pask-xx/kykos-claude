import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, setSessionCookie, hashPassword } from '@/lib/auth';
import { Role, OrgType } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const {
      email,
      password,
      role,
      firstName,
      lastName,
      birthDate,
      fiscalCode,
      address,
      cap,
      city,
      houseNumber,
      orgName,
      orgType,
      referenceEntityId,
      isee,
    } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email e password sono obbligatorie' },
        { status: 400 }
      );
    }

    if (!['DONOR', 'RECIPIENT', 'INTERMEDIARY'].includes(role)) {
      return NextResponse.json(
        { error: 'Ruolo non valido' },
        { status: 400 }
      );
    }

    // Validate required fields for RECIPIENT
    if (role === 'RECIPIENT') {
      if (!firstName || !lastName || !birthDate || !fiscalCode || !address || !cap || !city || !houseNumber) {
        return NextResponse.json(
          { error: 'Tutti i campi anagrafici sono obbligatori per i riceventi' },
          { status: 400 }
        );
      }
      if (!referenceEntityId || !isee) {
        return NextResponse.json(
          { error: 'Ente di riferimento e ISEE sono obbligatori per i riceventi' },
          { status: 400 }
        );
      }
    }

    // Validate fiscal code format (16 chars)
    if (fiscalCode && fiscalCode.length !== 16) {
      return NextResponse.json(
        { error: 'Codice fiscale non valido (16 caratteri)' },
        { status: 400 }
      );
    }

    if (!['DONOR', 'RECIPIENT', 'INTERMEDIARY'].includes(role)) {
      return NextResponse.json(
        { error: 'Ruolo non valido' },
        { status: 400 }
      );
    }

    if (role === 'INTERMEDIARY' && (!orgName || !orgType)) {
      return NextResponse.json(
        { error: 'Nome e tipo organizzazione sono obbligatori per enti' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 400 }
      );
    }

    // Verify reference entity exists (for RECIPIENT)
    if (role === 'RECIPIENT' && referenceEntityId) {
      const entity = await prisma.organization.findUnique({
        where: { id: referenceEntityId },
      });

      if (!entity) {
        return NextResponse.json(
          { error: 'Ente di riferimento non valido' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Build name from firstName and lastName
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || email);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: fullName,
        email,
        passwordHash,
        role: role as Role,
        firstName: firstName || null,
        lastName: lastName || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        fiscalCode: fiscalCode || null,
        address: address || null,
        cap: cap || null,
        city: city || null,
        houseNumber: houseNumber || null,
        ...(role === 'INTERMEDIARY' && {
          intermediaryOrg: {
            create: {
              name: orgName,
              type: orgType as OrgType,
            },
          },
        }),
        ...(role === 'DONOR' && {
          donorProfile: {
            create: {
              level: 'BRONZE',
              totalDonations: 0,
              totalObjects: 0,
            },
          },
        }),
        ...(role === 'RECIPIENT' && {
          referenceEntityId,
          isee: parseFloat(isee),
          authorized: false,
        }),
      },
      include: {
        intermediaryOrg: true,
        donorProfile: true,
      },
    });

    // Create session
    const token = await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : '';
    return NextResponse.json(
      { error: 'Errore interno del server', details: message, stack: stack },
      { status: 500 }
    );
  }
}
