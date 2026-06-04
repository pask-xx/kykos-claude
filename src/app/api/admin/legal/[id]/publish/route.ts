import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';
import { invalidateActiveVersionsCache, invalidateDocumentHashCache } from '@/lib/legal';

interface PublishParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/legal/[id]/publish
 *
 * Pubblica una versione scheduled come ATTIVA.
 *
 * Transazione atomica:
 * 1. Imposta la versione [id] come active + publishedAt = now()
 * 2. Trova la precedente versione active dello stesso type (se esiste)
 *    e la archivia (status='archived', archivedAt=now())
 *
 * Perché transazione: se due admin cliccano "pubblica" nello stesso
 * secondo, non vogliamo che entrambe le versioni finiscano "active".
 * Prisma transactions con la stessa SELECT (status='active') all'interno
 * della tx sono serializzate dal DB (default isolation level).
 *
 * Dopo la transazione: invalida la cache in-memory di getActiveVersions
 * E di getDocumentHash (la nuova versione ha un hash diverso).
 *
 * Effetto collaterale atteso: tutti gli utenti loggati riceveranno la
 * schermata "Devi riaccettare" al prossimo accesso. Vedi
 * src/app/auth/check-legal/page.tsx.
 */
export const POST = withErrorHandler(async (_request: Request, ctx: PublishParams) => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo admin' }, { status: 403 });
  }

  const { id } = await ctx.params;

  // Esegui tutto in transazione: o entrambe le update vanno a buon fine
  // o nessuna.
  const result = await prisma.$transaction(async (tx) => {
    const target = await tx.legalDocumentVersion.findUnique({
      where: { id },
      select: { id: true, type: true, version: true, status: true },
    });

    if (!target) {
      return { error: 'Versione non trovata' as const };
    }
    if (target.status === 'active') {
      return { error: 'Versione già attiva' as const };
    }
    if (target.status === 'archived') {
      return { error: 'Versione archiviata, non può essere ripubblicata' as const };
    }

    // Archivia la precedente versione attiva dello stesso type (se esiste)
    const previousActive = await tx.legalDocumentVersion.findFirst({
      where: { type: target.type, status: 'active' },
      select: { id: true, version: true },
    });

    const now = new Date();

    if (previousActive && previousActive.id !== target.id) {
      await tx.legalDocumentVersion.update({
        where: { id: previousActive.id },
        data: {
          status: 'archived',
          archivedAt: now,
        },
      });
    }

    // Pubblica la target
    const published = await tx.legalDocumentVersion.update({
      where: { id: target.id },
      data: {
        status: 'active',
        publishedAt: now,
      },
      select: {
        id: true,
        type: true,
        version: true,
        status: true,
        publishedAt: true,
        hash: true,
      },
    });

    return {
      published,
      previousVersion: previousActive?.version ?? null,
    };
  });

  if ('error' in result) {
    const status =
      result.error === 'Versione non trovata' ? 404 :
      400;
    return NextResponse.json({ error: result.error }, { status });
  }

  // Invalida cache in-memory: la nuova versione attiva deve essere vista
  // dalle prossime richieste, e il nuovo hash del documento deve essere
  // ricalcolato.
  invalidateActiveVersionsCache();
  invalidateDocumentHashCache(result.published.type as 'TERMS' | 'PRIVACY');

  // Audit log
  await prisma.adminAction.create({
    data: {
      adminId: session.id,
      action: 'legal_doc.publish',
      targetType: 'LegalDocumentVersion',
      targetId: result.published.id,
    },
  });

  return NextResponse.json({
    published: result.published,
    previousVersion: result.previousVersion,
    message: `Versione ${result.published.version} pubblicata. Tutti gli utenti riceveranno la schermata di re-consenso al prossimo accesso.`,
  });
}, 'POST /api/admin/legal/[id]/publish');
