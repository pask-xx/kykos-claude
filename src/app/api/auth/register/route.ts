import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { geocodeAddress } from '@/lib/geocode';
import { sendOtpEmail } from '@/lib/email';
import { Role, OrgType } from '@prisma/client';
import { generateOrgCode } from '@/lib/utils';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function generateUniqueOrgCode(): Promise<string> {
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

    if (role === 'INTERMEDIARY' && (!orgName || !orgType)) {
      return NextResponse.json(
        { error: 'Nome e tipo organizzazione sono obbligatori per enti' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 400 }
      );
    }

    // Check if there's already a pending registration with this email
    const existingPending = await prisma.pendingRegistration.findUnique({
      where: { email },
    });

    if (existingPending) {
      // Delete old pending registration
      await prisma.pendingRegistration.delete({ where: { email } });
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

    // Generate OTP
    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create pending registration instead of user
    await prisma.pendingRegistration.create({
      data: {
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
        referenceEntityId: role === 'RECIPIENT' ? referenceEntityId : null,
        isee: role === 'RECIPIENT' && isee ? Math.round(parseFloat(isee) * 100) / 100 : null,
        orgName: role === 'INTERMEDIARY' ? orgName : null,
        orgType: role === 'INTERMEDIARY' ? orgType as OrgType : null,
        otpCode,
        otpExpiresAt,
      },
    });

    // Send OTP email
    await sendOtpEmail(email, otpCode, 10);

    return NextResponse.json({
      message: 'Codice di verifica inviato',
      email,
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