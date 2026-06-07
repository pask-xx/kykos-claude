import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api';
import { clearOperatorSessionCookie } from '@/lib/auth';

export const GET = withErrorHandler(async (request: NextRequest) => {
  await clearOperatorSessionCookie();
  return NextResponse.redirect(`${new URL(request.url).origin}/auth/login`);
}, 'GET /api/operator/logout');

export const POST = withErrorHandler(async (request: NextRequest) => {
  await clearOperatorSessionCookie();
  return NextResponse.redirect(`${new URL(request.url).origin}/auth/login`);
}, 'POST /api/operator/logout');
