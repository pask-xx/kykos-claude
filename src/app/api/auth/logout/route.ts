import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await clearSessionCookie();
    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/`);
  } catch (error) {
    console.error('Logout error:', error);
    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/`);
  }
}

export async function GET(request: NextRequest) {
  try {
    await clearSessionCookie();
    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/`);
  } catch (error) {
    console.error('Logout error:', error);
    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/`);
  }
}
