import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';
import { geocodeAddress } from '@/lib/geocode';
import { sendWelcomeEmail } from '@/lib/email';
import { sendConfirmationEmail } from '@/lib/email';
import { Role, OrgType } from '@prisma/client';
import { generateOrgCode } from '@/lib/utils';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

async function generateConfirmationToken(userId: string, email: string): Promise<string> {
  return await new SignJWT({ userId, email, purpose: 'email_confirmation' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // Token valid for 24 hours
    .sign(JWT_SECRET);
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

    // Check if email already exists in KYKOS DB
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 400 }
      );
    }

    // For non-OAuth registrations, check if email exists in Supabase Auth
    // (OAuth users already have Supabase Auth user created during OAuth callback)
    if (!isOAuth) {
      console.log('Checking Supabase Auth for existing user with email:', email);
      const { data: supabaseUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

      if (listError) {
        console.error('Error listing Supabase users:', listError);
      }

      const existingSupabaseUser = supabaseUsers?.users.find(u => u.email === email);
      console.log('Found existing Supabase user:', existingSupabaseUser ? 'yes' : 'no', existingSupabaseUser?.id);

      if (existingSupabaseUser) {
        return NextResponse.json(
          { error: 'Email già registrata. Prova a fare login o reimposta la password.' },
          { status: 400 }
        );
      }
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

    let authUserId: string;

    // OAuth users already have a Supabase Auth user created during the OAuth callback
    if (isOAuth) {
      // Find existing Supabase Auth user by email
      const { data: supabaseUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        console.error('Error listing Supabase users:', listError);
        return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
      }
      const existingUser = supabaseUsers?.users.find(u => u.email === email);
      if (!existingUser) {
        console.error('OAuth user not found in Supabase Auth');
        return NextResponse.json({ error: 'Sessione OAuth non valida. Riprova il login con Google.' }, { status: 400 });
      }
      authUserId = existingUser.id;
    } else {
      // Create user in Supabase Auth for non-OAuth registrations
      console.log('Creating Supabase Auth user with:', { email, role });
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Supabase confirms immediately, we send our own email
        user_metadata: {
          role,
          firstName: firstName || null,
          lastName: lastName || null,
          fullName,
        },
      });

      console.log('Supabase Auth result:', { authData, authError });

      if (authError) {
        console.error('Supabase Auth error:', authError);

        // Check for email_exists specifically
        if (authError.code === 'email_exists') {
          return NextResponse.json(
            { error: 'Email già registrata. Prova a fare login o reimposta la password.' },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: 'Errore durante la registrazione. Riprova.' },
          { status: 500 }
        );
      }

      if (!authData.user) {
        return NextResponse.json(
          { error: 'Errore durante la registrazione. Riprova.' },
          { status: 500 }
        );
      }

      authUserId = authData.user.id;
    }

    // Generate our own confirmation token
    const confirmToken = await generateConfirmationToken(authUserId, email);

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
        emailConfirmed: false, // Requires email confirmation
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

    // Send our own confirmation email via Resend
    await sendConfirmationEmail(email, fullName, confirmToken);

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
