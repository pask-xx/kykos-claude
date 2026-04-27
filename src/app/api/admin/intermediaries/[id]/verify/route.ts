import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 });
    }

    const { id } = await params;

    // Update organization to verified
    await prisma.organization.update({
      where: { id },
      data: { verified: true },
    });

    // Redirect back to admin dashboard with success message
    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/admin/dashboard?verified=true`);
  } catch (error) {
    console.error('Error verifying intermediary:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
