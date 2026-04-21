import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ user: null });
  }

  // Get full user data
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      donorProfile: true,
      intermediaryOrg: true,
    },
  });

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      donorProfile: user.donorProfile,
      intermediaryOrg: user.intermediaryOrg,
    },
  });
}
