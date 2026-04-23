import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, setSessionCookie } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { email, name, role } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Map role string to Role enum (default to DONOR)
    const userRole: Role = role === 'recipient' ? 'RECIPIENT' : 'DONOR';

    // Check if user exists in our DB
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // If user doesn't exist, create them with the specified role
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          passwordHash: '', // No password for OAuth users
          role: userRole,
          donorProfile: userRole === 'DONOR' ? {
            create: {
              level: 'BRONZE',
              totalDonations: 0,
              totalObjects: 0,
            },
          } : undefined,
        },
      });
    }

    // Create our app session
    const token = await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('OAuth session creation error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
