import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';
import { geocodeAddress } from '@/lib/geocode';
import { sendWelcomeEmail } from '@/lib/email';
import { Role, OrgType } from '@prisma/client';
import { generateOrgCode } from '@/lib/utils';

function generateOrgCode(): string {
  return Math.random().toString(16).substring(2, 8).toUpperCase();
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

    if (role === 'INTERMEDIARY' && (!orgName || !orgType)) {
      return NextResponse.json(
        { error: 'Nome e tipo organizzazione sono obbligatori per enti' },
        { status: 400 }
      );
    }

    // Check if user already exists in KYKOS DB
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

    // Build name from firstName and lastName
    const fullName = firstName && lastName
      ? `${firstName} ${lastName}`
      : (firstName || lastName || email.split('@')[0]);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email confirmation
      user_metadata: {
        role,
        firstName: firstName || null,
        lastName: lastName || null,
        fullName,
      },
    });

    if (authError || !authData.user) {
      console.error('Supabase Auth error:', authError);
      return NextResponse.json(
        { error: 'Errore durante la registrazione. Riprova.' },
        { status: 500 }
      );
    }

    const authUserId = authData.user.id;

    // Geocode address if needed
    let lat = latitude ? parseFloat(latitude) : null;
    let lng = longitude ? parseFloat(longitude) : null;

    if (!lat && !lng && address && city) {
      const geoResult = await geocodeAddress(address, city, cap || '');
      if (geoResult) {
        lat = geoResult.latitude;
        lng = geoResult.longitude;
      }
    }

    // Create KYKOS User record
    const user = await prisma.user.create({
      data: {
        authUserId,
        email,
        name: fullName,
        role: role as Role,
        firstName: firstName || null,
        lastName: lastName || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        fiscalCode: fiscalCode || null,
        address: address || null,
        cap: cap || null,
        city: city || null,
        houseNumber: houseNumber || null,
        latitude: lat,
        longitude: lng,
        referenceEntityId: role === 'RECIPIENT' ? referenceEntityId : null,
        isee: role === 'RECIPIENT' && isee ? Math.round(parseFloat(isee) * 100) / 100 : null,
        authorized: false, // Will be authorized after email confirmation
        ...(role === 'INTERMEDIARY' && orgName && orgType && {
          intermediaryOrg: {
            create: {
              name: orgName,
              type: orgType as OrgType,
              code: generateOrgCode(),
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
      },
      include: {
        intermediaryOrg: true,
        donorProfile: true,
      },
    });

    // Supabase will send confirmation email automatically
    // User will be able to login after confirming their email

    return NextResponse.json({
      message: 'Registrazione completata. Controlla la email per confermare il tuo account.',
      email: user.email,
      needsEmailConfirmation: true,
    });
  } catch (error) {
    console.error('Register error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Errore interno del server', details: message },
      { status: 500 }
    );
  }
}
