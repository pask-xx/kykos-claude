import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { withErrorHandler } from '@/lib/api';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const cookieStore = await cookies();
  cookieStore.delete('operator_session');
  return NextResponse.redirect(`${new URL(request.url).origin}/auth/login`);
}, 'GET /api/operator/logout');

export const POST = withErrorHandler(async (request: NextRequest) => {
  const cookieStore = await cookies();
  cookieStore.delete('operator_session');
  return NextResponse.redirect(`${new URL(request.url).origin}/auth/login`);
}, 'POST /api/operator/logout');
