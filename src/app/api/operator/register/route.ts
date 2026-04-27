import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { generateOperatorUsername } from '@/lib/utils';
import { sendOperatorCredentialsEmail } from '@/lib/email';
import { randomBytes } from 'crypto';

function generateTempPassword(length = 12): string {
  return randomBytes(length).toString('base64').slice(0, length);
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Only intermediary users can create operators
    if (session.role !== 'INTERMEDIARY') {
      return NextResponse.json(
        { error: 'Solo gli intermediari possono creare operatori' },
        { status: 403 }
      );
    }

    const {
      firstName,
      lastName,
      password,
      role,
      notifyEmail, // Optional custom email for notifications
    } = await request.json();

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'Nome e cognome sono obbligatori' },
        { status: 400 }
      );
    }

    // Get organization for current user
    const organization = await prisma.organization.findUnique({
      where: { userId: session.id },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organizzazione non trovata' },
        { status: 404 }
      );
    }

    // Generate username from firstName.lastName
    let username = generateOperatorUsername(firstName, lastName, organization.code);

    // Check if username already exists (globally unique now)
    let existing = await prisma.operator.findUnique({
      where: { username },
    });

    // If exists, generate with suffix until unique
    let suffix = 2;
    while (existing) {
      username = `${generateOperatorUsername(firstName, lastName, organization.code)}.${suffix}`;
      existing = await prisma.operator.findUnique({
        where: { username },
      });
      suffix++;
    }

    // Generate temp password if not provided
    const tempPassword = password || generateTempPassword();

    // Create operator email for Supabase Auth
    const operatorEmail = `${username}@kykos.operators`;

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: operatorEmail,
      password: tempPassword,
      email_confirm: true, // Operators don't need email confirmation
      user_metadata: {
        firstName,
        lastName,
        organizationId: organization.id,
        organizationName: organization.name,
      },
    });

    if (authError || !authData.user) {
      console.error('Supabase Auth error:', authError);
      return NextResponse.json(
        { error: 'Errore durante la creazione dell\'account operatore' },
        { status: 500 }
      );
    }

    // Create operator in KYKOS DB
    const operator = await prisma.operator.create({
      data: {
        supabaseAuthId: authData.user.id,
        username,
        email: operatorEmail,
        phone: null,
        firstName,
        lastName,
        role: role || 'OPERATORE',
        organizationId: organization.id,
        // No passwordHash - Supabase handles auth
      },
    });

    // Send credentials email if notifyEmail is provided, otherwise show in UI
    let emailSent = false;
    const emailToNotify = notifyEmail || null;
    if (emailToNotify) {
      emailSent = await sendOperatorCredentialsEmail(
        emailToNotify,
        `${operator.firstName} ${operator.lastName}`,
        operator.username,
        tempPassword,
        organization.name
      );
    }

    return NextResponse.json({
      operator: {
        id: operator.id,
        username: operator.username,
        email: operator.email,
        phone: operator.phone,
        firstName: operator.firstName,
        lastName: operator.lastName,
        role: operator.role,
        active: operator.active,
      },
      tempPassword, // Always return so UI can show it if email fails
      emailSent,
    });
  } catch (error) {
    console.error('Operator register error:', error);
    return NextResponse.json(
      { error: 'Errore interno' },
      { status: 500 }
    );
  }
}
