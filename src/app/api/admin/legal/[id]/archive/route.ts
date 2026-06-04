import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';
import { invalidateActiveVersionsCache, invalidateDocumentHashCache } from '@/lib/legal';

interface ArchiveParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/legal/[id]/archive
 *
 * Archivia manualmente una versione scheduled o active.
 *
 * Caso d'uso: l'admin ha uploadato una versione scheduled con un errore
 * e vuole rimuoverla prima di pubblicare la successiva. Oppure vuole
 * forzare il rollback di una versione active a archived (impossibile
 * ripristinare da qui — per quello c'è publish su un'altra versione).
 *
 * NB: l'archive di una versione attiva NON è un rollback di per sé.
 * Dopo l'archive, getActiveVersions ritorna '0.0' per quel type
 * (nessuna active), e tutti gli utenti riceveranno la schermata di
 * re-consenso. Per un vero rollback, l'admin deve ri-pubblicare la
 * versione precedente (già archiviata).
 */
export const POST = withErrorHandler(async (_request: Request, ctx: ArchiveParams) => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo admin' }, { status: 403 });
  }

  const { id } = await ctx.params;

  const target = await prisma.legalDocumentVersion.findUnique({
    where: { id },
    select: { id: true, type: true, version: true, status: true },
  });

  if (!target) {
    return NextResponse.json({ error: 'Versione non trovata' }, { status: 404 });
  }
  if (target.status === 'archived') {
    return NextResponse.json(
      { error: 'Versione già archiviata' },
      { status: 400 }
    );
  }

  const archived = await prisma.legalDocumentVersion.update({
    where: { id: target.id },
    data: {
      status: 'archived',
      archivedAt: new Date(),
    },
    select: {
      id: true,
      type: true,
      version: true,
      status: true,
      archivedAt: true,
    },
  });

  // Invalida cache: se era attiva, la prossima getActiveVersions non deve
  // più vederla. Il hash per quell'eventuale versione non serve più.
  invalidateActiveVersionsCache();
  invalidateDocumentHashCache(target.type as 'TERMS' | 'PRIVACY', target.version);

  // Audit log
  await prisma.adminAction.create({
    data: {
      adminId: session.id,
      action: 'legal_doc.archive',
      targetType: 'LegalDocumentVersion',
      targetId: archived.id,
    },
  });

  return NextResponse.json({
    archived,
    message: `Versione ${archived.version} archiviata.`,
  });
}, 'POST /api/admin/legal/[id]/archive');
