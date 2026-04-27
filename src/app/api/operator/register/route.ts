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
      notifyEmail,
      role,
    } = await request.json();

    // Validate required fields
    if (!firstName || !lastName || !notifyEmail) {
      return NextResponse.json(
        { error: 'Nome, cognome e email per notifiche sono obbligatori' },
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

    // Generate base username from firstName.lastName (no org code suffix)
    let username = generateOperatorUsername(firstName, lastName);

    // Check if username already exists - append .1, .2, etc. until unique
    let existing = await prisma.operator.findUnique({
      where: { username },
    });

    if (existing) {
      let counter = 1;
      while (true) {
        const newUsername = `${generateOperatorUsername(firstName, lastName)}.${counter}`;
        const check = await prisma.operator.findUnique({
          where: { username: newUsername },
        });
        if (!check) break;
        counter++;
      }
      username = `${generateOperatorUsername(firstName, lastName)}.${counter}`;
    }

    // Generate temp password
    const tempPassword = generateTempPassword();

    // Create operator email for Supabase Auth: username@kykos.operators
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

    // Send credentials email to the notifyEmail provided by intermediary
    const emailSent = notifyEmail
      ? await sendOperatorCredentialsEmail(
          notifyEmail,
          `${operator.firstName} ${operator.lastName}`,
          operator.username,
          tempPassword,
          organization.name
        )
      : false;

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
        notifyEmail,
      },
      tempPassword,
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
