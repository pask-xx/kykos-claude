import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, setSessionCookie } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';
import { geocodeAddress } from '@/lib/geocode';

function generateOrgCode(): string {
  return Math.random().toString(16).substring(2, 8).toUpperCase();
}

export async function POST(request: Request) {
  try {
    const { email, otpCode } = await request.json();

    if (!email || !otpCode) {
      return NextResponse.json(
        { error: 'Email e codice OTP sono obbligatori' },
        { status: 400 }
      );
    }

    // Find pending registration
    const pending = await prisma.pendingRegistration.findUnique({
      where: { email },
    });

    if (!pending) {
      return NextResponse.json(
        { error: 'Nessuna registrazione in corso per questa email' },
        { status: 404 }
      );
    }

    // Check if OTP is correct
    if (pending.otpCode !== otpCode) {
      return NextResponse.json(
        { error: 'Codice OTP non valido' },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (new Date() > pending.otpExpiresAt) {
      return NextResponse.json(
        { error: 'Codice OTP scaduto. Richiedi un nuovo codice.' },
        { status: 400 }
      );
    }

    // Build name from firstName and lastName
    const fullName = pending.firstName && pending.lastName
      ? `${pending.firstName} ${pending.lastName}`
      : (pending.firstName || pending.lastName || email);

    // Create user from pending registration data
    const user = await prisma.user.create({
      data: {
        name: fullName,
        email: pending.email,
        passwordHash: pending.passwordHash,
        role: pending.role,
        firstName: pending.firstName,
        lastName: pending.lastName,
        birthDate: pending.birthDate,
        fiscalCode: pending.fiscalCode,
        address: pending.address,
        cap: pending.cap,
        city: pending.city,
        houseNumber: pending.houseNumber,
        latitude: pending.latitude,
        longitude: pending.longitude,
        referenceEntityId: pending.referenceEntityId,
        isee: pending.isee,
        authorized: false,
        ...(pending.role === 'INTERMEDIARY' && pending.orgName && pending.orgType && {
          intermediaryOrg: {
            create: {
              name: pending.orgName,
              type: pending.orgType,
              code: generateOrgCode(),
            },
          },
        }),
        ...(pending.role === 'DONOR' && {
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

    // Geocode address if coordinates not provided
    if (!pending.latitude && !pending.longitude && pending.address && pending.city) {
      const geoResult = await geocodeAddress(pending.address, pending.city, pending.cap || '');
      if (geoResult) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            latitude: geoResult.latitude,
            longitude: geoResult.longitude,
          },
        });
      }
    }

    // Delete pending registration
    await prisma.pendingRegistration.delete({ where: { email } });

    // Create session
    const token = await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setSessionCookie(token);

    // Send welcome email
    const userRole = user.role as 'DONOR' | 'RECIPIENT' | 'INTERMEDIARY';
    sendWelcomeEmail(user.email, fullName, userRole).catch(err => {
      console.error('Failed to send welcome email:', err);
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Errore interno del server', details: message },
      { status: 500 }
    );
  }
}