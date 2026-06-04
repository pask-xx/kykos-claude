import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';

/**
 * GET /api/admin/legal
 *
 * Lista tutte le versioni dei documenti legali (scheduled, active, archived)
 * con i metadata minimi per la UI admin (versione, status, hash, size,
 * uploadedAt, publishedAt, archivedAt, notes).
 *
 * Solo ADMIN. Le versioni attive sono evidenziate nel client per il bottone
 * "Pubblica" vs "Archivia".
 */
export const GET = withErrorHandler(async () => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo admin' }, { status: 403 });
  }

  const versions = await prisma.legalDocumentVersion.findMany({
    orderBy: [{ type: 'asc' }, { uploadedAt: 'desc' }],
    select: {
      id: true,
      type: true,
      version: true,
      hash: true,
      fileSize: true,
      status: true,
      uploadedAt: true,
      publishedAt: true,
      archivedAt: true,
      notes: true,
      uploadedBy: {
        select: { email: true, name: true },
      },
    },
  });

  return NextResponse.json({ versions });
}, 'GET /api/admin/legal');
