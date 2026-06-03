import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
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
}, 'POST /api/admin/intermediaries/[id]/verify');
