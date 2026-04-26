import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete('operator_session');
  return NextResponse.redirect(`${new URL(request.url).origin}/login/operator`);
}

export async function POST(request: NextRequest) {
  return GET(request);
}
