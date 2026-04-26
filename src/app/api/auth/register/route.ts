import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, setSessionCookie, hashPassword } from '@/lib/auth';
import { geocodeAddress } from '@/lib/geocode';
import { sendWelcomeEmail } from '@/lib/email';
import { Role, OrgType } from '@prisma/client';
import { generateOrgCode } from '@/lib/utils';

async function generateUniqueOrgCode(): Promise<string> {
  // 6 hex digits = ~16.7M combinations, practically zero collision risk
  const code = generateOrgCode();
  const existing = await prisma.organization.findUnique({ where: { code } });
  if (existing) throw new Error('Codice ente non disponibile');
  return code;
}

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
      oauthProvider,
      latitude,
      longitude,
    } = await request.json();

    const isOAuth = oauthProvider === 'google';

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email e ruolo sono obbligatori' },
        { status: 400 }
      );
    }

    if (!isOAuth && !password) {
      return NextResponse.json(
        { error: 'Password obbligatoria per registrazione email' },
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

    // Hash password (skip for OAuth users)
    const passwordHash = isOAuth ? '' : await hashPassword(password);

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
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        ...(role === 'INTERMEDIARY' && {
          intermediaryOrg: {
            create: {
              name: orgName,
              type: orgType as OrgType,
              code: await generateUniqueOrgCode(),
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
          isee: Math.round(parseFloat(isee) * 100) / 100,
          authorized: false,
        }),
      },
      include: {
        intermediaryOrg: true,
        donorProfile: true,
      },
    });

    // Geocode address if coordinates not provided
    if (!latitude && !longitude && address && city) {
      const geoResult = await geocodeAddress(address, city, cap || '');
      if (geoResult) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            latitude: geoResult.latitude,
            longitude: geoResult.longitude,
          },
        });
      }
    }

    // Create session
    const token = await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setSessionCookie(token);

    // Send welcome email (async, don't wait)
    const userRole = user.role as 'DONOR' | 'RECIPIENT' | 'INTERMEDIARY';
    sendWelcomeEmail(user.email, fullName, userRole).catch(err => {
      console.error('Failed to send welcome email:', err);
    });

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
