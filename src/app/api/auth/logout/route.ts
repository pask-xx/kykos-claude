import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await clearSessionCookie();
  } catch (error) {
    console.error('Logout clear cookie error:', error);
  }
  const baseUrl = new URL(request.url).origin;
  return NextResponse.redirect(`${baseUrl}/`);
}

// Also handle POST for form submissions
export async function POST(request: NextRequest) {
  return GET(request);
}
