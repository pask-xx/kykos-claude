import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';
import { geocodeAddress } from '@/lib/geocode';
import { sendConfirmationEmail } from '@/lib/email';
import { Role, NotificationType, RecipientType } from '@prisma/client';
import { generateOrgCode, generateFantasyNickname } from '@/lib/utils';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

interface OperatorSession {
  operatorId: string;
  organizationId: string;
  username: string;
  role: string;
  isStreetOperator: boolean;
  isOfficeOperator: boolean;
}

async function getOperatorSession(): Promise<OperatorSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('operator_session')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as OperatorSession;
  } catch {
    return null;
  }
}

async function generateConfirmationToken(userId: string, email: string): Promise<string> {
  return await new SignJWT({ userId, email, purpose: 'email_confirmation' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

// POST - Create account for street beneficiary
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getOperatorSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (!session.isStreetOperator) {
      return NextResponse.json({ error: 'Solo operatori di strada' }, { status: 403 });
    }

    const { id: beneficiaryId } = await params;

    // Fetch the street beneficiary
    const beneficiary = await prisma.user.findFirst({
      where: {
        id: beneficiaryId,
        role: 'RECIPIENT',
        isStreetManaged: true,
        managedByStreetOperators: {
          some: {
            streetOperatorId: session.operatorId,
          },
        },
      },
      include: {
        referenceEntity: true,
      },
    });

    if (!beneficiary) {
      return NextResponse.json({ error: 'Beneficiario non trovato o non gestito da te' }, { status: 404 });
    }

    // Check if already has an account (has authUserId or emailConfirmed)
    if (beneficiary.authUserId || beneficiary.emailConfirmed) {
      return NextResponse.json({ error: 'Questo beneficiario ha già un account' }, { status: 400 });
    }

    // Check if email is configured and valid
    if (!beneficiary.email) {
      return NextResponse.json({ error: 'Email non configurata. Aggiungi prima un\'email al beneficiario.' }, { status: 400 });
    }

    // Check if email is a placeholder (system-generated fake email)
    const isPlaceholderEmail = beneficiary.email.includes('@street.kykos.local') ||
                               beneficiary.email.includes('@placeholder') ||
                               beneficiary.email.startsWith('street.');

    if (isPlaceholderEmail) {
      return NextResponse.json({ error: 'Email non valida. Aggiungi una email reale al beneficiario prima di creare l\'account.' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(beneficiary.email)) {
      return NextResponse.json({ error: 'Formato email non valido. Aggiungi una email valida al beneficiario.' }, { status: 400 });
    }

    // Check if email already exists in KYKOS DB (shouldn't happen since we checked above, but safety check)
    const existingUser = await prisma.user.findUnique({
      where: { email: beneficiary.email },
    });

    if (existingUser && existingUser.id !== beneficiary.id) {
      return NextResponse.json({ error: 'Email già registrata nel sistema' }, { status: 400 });
    }

    // Check if email exists in Supabase Auth
    const { data: supabaseUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingSupabaseUser = supabaseUsers?.users.find(u => u.email === beneficiary.email);

    if (existingSupabaseUser) {
      return NextResponse.json({ error: 'Email già registrata in Supabase Auth' }, { status: 400 });
    }

    // Generate a random password (will be changed by user after email confirmation)
    const tempPassword = generateTempPassword();

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: beneficiary.email,
      password: tempPassword,
      email_confirm: true, // Supabase confirms immediately, we send our own email
      user_metadata: {
        role: 'RECIPIENT',
        firstName: beneficiary.firstName || null,
        lastName: beneficiary.lastName || null,
        fullName: beneficiary.name,
      },
    });

    if (authError) {
      console.error('Supabase Auth error:', authError);
      return NextResponse.json({ error: 'Errore durante la creazione dell\'account. Riprova.' }, { status: 500 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Errore durante la creazione dell\'account' }, { status: 500 });
    }

    const authUserId = authData.user.id;

    // Generate confirmation token
    const confirmToken = await generateConfirmationToken(authUserId, beneficiary.email);

    // Generate nickname if not exists
    let finalNickname = beneficiary.nickname;
    if (!finalNickname) {
      finalNickname = await generateFantasyNickname();
    }

    // Geocode address if coordinates not stored
    let lat = beneficiary.latitude;
    let lng = beneficiary.longitude;

    if (!lat && !lng && beneficiary.address && beneficiary.city) {
      const geoResult = await geocodeAddress(beneficiary.address, beneficiary.city, beneficiary.cap || '');
      if (geoResult) {
        lat = geoResult.latitude;
        lng = geoResult.longitude;
      }
    }

    // Update KYKOS User record with auth info
    const updatedUser = await prisma.user.update({
      where: { id: beneficiary.id },
      data: {
        authUserId,
        nickname: finalNickname,
        emailConfirmed: false, // Requires email confirmation
        latitude: lat,
        longitude: lng,
      },
    });

    // Send confirmation email
    await sendConfirmationEmail(beneficiary.email, beneficiary.name, confirmToken);

    // Notify operators that a new recipient needs authorization
    if (beneficiary.referenceEntityId) {
      const operators = await prisma.operator.findMany({
        where: {
          organizationId: beneficiary.referenceEntityId,
          active: true,
        },
        select: { id: true },
      });

      const notifications = operators.map(op => ({
        recipientOperatorId: op.id,
        recipientType: RecipientType.OPERATOR,
        title: 'Nuovo account beneficiario da autorizzare',
        message: `${beneficiary.name} ha creato un account e richiede autorizzazione.`,
        type: NotificationType.NEW_REQUEST,
        link: '/operator/recipients',
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications });
      }
    }

    return NextResponse.json({
      message: 'Account creato. Email di conferma inviata.',
      email: beneficiary.email,
      needsEmailConfirmation: true,
    });
  } catch (error) {
    console.error('Create account error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Errore interno del server', details: message },
      { status: 500 }
    );
  }
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}