import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api';

export const POST = withErrorHandler(async (request: Request) => {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json(
      { error: 'Email obbligatoria' },
      { status: 400 }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: 'Email non valida' },
      { status: 400 }
    );
  }

  // Check if already registered
  const existing = await prisma.notifyEmail.findUnique({
    where: { email },
  });

  if (existing) {
    return NextResponse.json({
      success: true,
      message: 'Email già registrata per la notifica',
    });
  }

  // Save the email
  await prisma.notifyEmail.create({
    data: {
      email,
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Email registrata con successo',
  });
}, 'POST /api/notify-when-open');

export const GET = withErrorHandler(async () => {
  // Get all notify emails (for admin)
  const emails = await prisma.notifyEmail.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ emails });
}, 'GET /api/notify-when-open');