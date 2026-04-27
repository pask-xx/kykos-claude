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
      email,
      firstName,
      lastName,
      password,
      role,
    } = await request.json();

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, nome e cognome sono obbligatori' },
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

    // If exists, generate with org code suffix until unique
    while (existing) {
      username = `${generateOperatorUsername(firstName, lastName, organization.code)}.${organization.code.toLowerCase()}`;
      existing = await prisma.operator.findUnique({
        where: { username },
      });
      // If still exists, append a number
      if (!existing) break;
      const suffix = Math.floor(Math.random() * 1000);
      username = `${generateOperatorUsername(firstName, lastName, organization.code)}.${organization.code.toLowerCase()}.${suffix}`;
      existing = await prisma.operator.findUnique({
        where: { username },
      });
    }

    // Generate temp password if not provided
    const tempPassword = password || generateTempPassword();

    // Create operator email for Supabase Auth
    const operatorEmail = email; // User provides email directly

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

    // Send credentials email to operator
    const emailSent = await sendOperatorCredentialsEmail(
      operator.email,
      `${operator.firstName} ${operator.lastName}`,
      operator.username,
      tempPassword,
      organization.name
    );

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
