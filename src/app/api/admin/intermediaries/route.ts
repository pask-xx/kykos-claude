import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { generateOrgCode } from '@/lib/utils';
import { OrgType } from '@prisma/client';
import { randomBytes } from 'crypto';

function generateTempPassword(length = 12): string {
  return randomBytes(length).toString('base64').slice(0, length);
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 });
    }

    const intermediaries = await prisma.organization.findMany({
      include: {
        user: {
          select: { email: true, createdAt: true },
        },
        _count: {
          select: {
            objects: true,
            requests: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ intermediaries });
  } catch (error) {
    console.error('Error fetching intermediaries:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      orgName,
      orgType,
      address,
      cap,
      city,
      province,
      phone,
      latitude,
      longitude,
    } = await request.json();

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !orgName || !orgType) {
      return NextResponse.json(
        { error: 'Tutti i campi sono obbligatori' },
        { status: 400 }
      );
    }

    if (!['CHARITY', 'CHURCH', 'ASSOCIATION'].includes(orgType)) {
      return NextResponse.json(
        { error: 'Tipo organizzazione non valido' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'INTERMEDIARY',
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
      },
    });

    if (authError || !authData.user) {
      console.error('Supabase Auth error:', authError);
      return NextResponse.json(
        { error: 'Errore durante la creazione dell\'account' },
        { status: 500 }
      );
    }

    const authUserId = authData.user.id;

    // Create user first, then organization
    const result = await prisma.$transaction(async (tx) => {
      // Create user first (without userId initially since org doesn't exist yet)
      const user = await tx.user.create({
        data: {
          authUserId,
          email,
          name: `${firstName} ${lastName}`,
          firstName,
          lastName,
          role: 'INTERMEDIARY',
          authorized: true,
          emailConfirmed: true,
        },
      });

      // Create organization linked to user
      const orgTypeValue = orgType as 'CHARITY' | 'CHURCH' | 'ASSOCIATION';
      const org = await tx.organization.create({
        data: {
          code: generateOrgCode(),
          name: String(orgName),
          type: orgTypeValue,
          address: address ? String(address) : null,
          cap: cap ? String(cap) : null,
          city: city ? String(city) : null,
          province: province ? String(province) : null,
          phone: phone ? String(phone) : null,
          latitude: latitude ? parseFloat(String(latitude)) : null,
          longitude: longitude ? parseFloat(String(longitude)) : null,
          verified: true,
          userId: user.id,
        },
      });

      return { org, user };
    });

    return NextResponse.json({
      success: true,
      intermediary: result.org,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
    });
  } catch (error) {
    console.error('Error creating intermediary:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
