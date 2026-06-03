import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';
import { geocodeAddress } from '@/lib/geocode';
import { sendWelcomeEmail } from '@/lib/email';
import { sendConfirmationEmail } from '@/lib/email';
import { Role, OrgType, NotificationType, RecipientType, LegalDocumentType } from '@prisma/client';
import { generateOrgCode, generateFantasyNickname } from '@/lib/utils';
import { SignJWT } from 'jose';
import { getJwtSecret } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';
import {
  getActiveVersions,
  getDocumentHash,
  extractRequestMetadata,
} from '@/lib/legal';

const JWT_SECRET = getJwtSecret();

async function generateConfirmationToken(userId: string, email: string): Promise<string> {
  return await new SignJWT({ userId, email, purpose: 'email_confirmation' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // Token valid for 24 hours
    .sign(JWT_SECRET);
}

export const POST = withErrorHandler(async (request: Request) => {
  const {
    email,
    password,
    role,
    nickname,
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
    secret,
    dioceseId,
    acceptTerms,
    acceptPrivacy,
  } = await request.json();

  // Generate fantasy nickname if not provided
  let finalNickname = nickname?.trim() || null;
  if (!finalNickname) {
    finalNickname = await generateFantasyNickname();
  }

  // Staging secret gate: if STAGING_REGISTRATION_SECRET is set, require the secret
  const stagingSecret = process.env.STAGING_REGISTRATION_SECRET;
  if (stagingSecret && secret !== stagingSecret) {
    return NextResponse.json(
      { error: 'Codice di registrazione non valido' },
      { status: 403 }
    );
  }

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

  // GDPR: il consenso a Privacy e ToS è obbligatorio per la registrazione
  // (Reg. UE 2016/679 + Provv. Garante n. 229/2014). Il client NON può
  // scegliere la versione: viene usata getActiveVersions() (legge la
  // versione attiva da DB) e l'hash viene calcolato server-side con
  // getDocumentHash(), così l'utente non può accettare un PDF diverso
  // da quello che vede.
  if (acceptTerms !== true && acceptTerms !== 'true') {
    return NextResponse.json(
      { error: 'Devi accettare le Condizioni d\'uso per procedere' },
      { status: 400 }
    );
  }
  if (acceptPrivacy !== true && acceptPrivacy !== 'true') {
    return NextResponse.json(
      { error: 'Devi accettare l\'Informativa Privacy per procedere' },
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
      nickname: finalNickname,
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
      dioceseId: dioceseId || null, // Diocese is now mandatory for all roles (set in UI)
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
            dioceseId: dioceseId || null,
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

  // GDPR: registra i consensi legali contestualmente alla creazione del
  // user. Usiamo upsert con chiave @@unique([userId, documentType, version])
  // per idempotenza (anche se l'utente dovesse inviare due volte la stessa
  // registrazione in rapida successione, no P2002 → niente errore). IP e
  // UA sono estratti dalla request per la prova legale.
  //
  // Le versioni sono lette da getActiveVersions() (legge da DB) e gli
  // hash da getDocumentHash() (Scarica + SHA-256 del PDF da Supabase
  // Storage). Entrambi async, calcolati una volta e riutilizzati nei
  // due upsert.
  const { ipAddress, userAgent } = extractRequestMetadata(request);
  const activeVersions = await getActiveVersions();
  const [termsHash, privacyHash] = await Promise.all([
    getDocumentHash('TERMS'),
    getDocumentHash('PRIVACY'),
  ]);
  await Promise.all([
    prisma.legalConsent.upsert({
      where: {
        userId_documentType_version: {
          userId: user.id,
          documentType: 'TERMS' as LegalDocumentType,
          version: activeVersions.TERMS,
        },
      },
      create: {
        userId: user.id,
        documentType: 'TERMS' as LegalDocumentType,
        version: activeVersions.TERMS,
        documentHash: termsHash,
        ipAddress,
        userAgent,
      },
      update: {
        // No-op: ipAddress/userAgent/hash sono "first-write-wins" per
        // preservare la prova originaria del consenso.
      },
    }),
    prisma.legalConsent.upsert({
      where: {
        userId_documentType_version: {
          userId: user.id,
          documentType: 'PRIVACY' as LegalDocumentType,
          version: activeVersions.PRIVACY,
        },
      },
      create: {
        userId: user.id,
        documentType: 'PRIVACY' as LegalDocumentType,
        version: activeVersions.PRIVACY,
        documentHash: privacyHash,
        ipAddress,
        userAgent,
      },
      update: {
        // No-op: vedi sopra.
      },
    }),
  ]);

  // Send our own confirmation email via Resend
  await sendConfirmationEmail(email, fullName, confirmToken);

  // Notify operators when a new RECIPIENT registers (needs authorization)
  if (role === 'RECIPIENT' && user.referenceEntityId) {
    const operators = await prisma.operator.findMany({
      where: {
        organizationId: user.referenceEntityId,
        active: true,
      },
      select: { id: true },
    });

    const notifications = operators.map(op => ({
      recipientOperatorId: op.id,
      recipientType: RecipientType.OPERATOR,
      title: 'Nuovo beneficiario da autorizzare',
      message: `${fullName} si è registrato come beneficiario e richiede autorizzazione.`,
      type: NotificationType.NEW_REQUEST,
      link: '/operator/recipients',
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }
  }

  return NextResponse.json({
    message: 'Registrazione completata. Controlla la email per confermare il tuo account.',
    email: user.email,
    needsEmailConfirmation: true,
  });
}, 'POST /api/auth/register');
