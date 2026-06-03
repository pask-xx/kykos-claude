import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';

export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    await clearSessionCookie();
  } catch (error) {
    console.error('Logout clear cookie error:', error);
  }
  const baseUrl = new URL(request.url).origin;
  return NextResponse.redirect(`${baseUrl}/`);
}, 'GET /api/auth/logout');

// Also handle POST for form submissions
export const POST = withErrorHandler(async (request: NextRequest) => {
  return GET(request);
}, 'POST /api/auth/logout');
