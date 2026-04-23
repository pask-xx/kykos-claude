import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  await clearSessionCookie();
  return NextResponse.redirect('/');
}

export async function GET() {
  await clearSessionCookie();
  return NextResponse.redirect('/');
}
