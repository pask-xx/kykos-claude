import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { generateOperatorUsername } from '@/lib/utils';

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
      phone,
      firstName,
      lastName,
      password,
      role,
    } = await request.json();

    // Validate required fields
    if (!email || !firstName || !lastName || !password) {
      return NextResponse.json(
        { error: 'Email, nome, cognome e password sono obbligatori' },
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

    // Check if username already exists in this organization
    const existing = await prisma.operator.findUnique({
      where: {
        organizationId_username: {
          organizationId: organization.id,
          username: username,
        },
      },
    });

    // If exists, generate with unique suffix
    if (existing) {
      username = generateOperatorUsername(firstName, lastName, organization.code);
    }

    // Create operator email for Supabase Auth
    const operatorEmail = `${username}@kykos.operators`;

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: operatorEmail,
      password,
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
        phone: phone || null,
        firstName,
        lastName,
        role: role || 'OPERATORE',
        organizationId: organization.id,
        // No passwordHash - Supabase handles auth
      },
    });

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
    });
  } catch (error) {
    console.error('Operator register error:', error);
    return NextResponse.json(
      { error: 'Errore interno' },
      { status: 500 }
    );
  }
}
