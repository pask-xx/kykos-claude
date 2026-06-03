import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';
import {
  getActiveVersions,
  getCurrentDocumentMeta,
  type LegalDocumentType,
} from '@/lib/legal';

/**
 * GET /api/legal/status
 *
 * Ritorna lo stato del consenso per ciascun documento legale:
 * - current: la versione richiesta da KYKOS
 * - accepted: la versione accettata dall'utente (null se mai accettato)
 * - outdated: true se l'utente deve riaccettare
 * - url: link al PDF corrente
 *
 * Usato dal client per decidere se mostrare il banner "Devi riaccettare".
 */
export const GET = withErrorHandler(async () => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const result: Record<LegalDocumentType, {
    current: string;
    accepted: string | null;
    outdated: boolean;
    url: string;
  }> = {
    TERMS: {} as never,
    PRIVACY: {} as never,
  };

  // getActiveVersions() legge da DB (sostituisce la costante
  // CURRENT_LEGAL_VERSIONS hardcoded). Restituisce la versione attiva
  // per ciascun type, oppure '0.0' se nessuna versione è stata pubblicata
  // (es. data migration 009 non ancora eseguita).
  const activeVersions = await getActiveVersions();

  for (const type of Object.keys(activeVersions) as LegalDocumentType[]) {
    const meta = await getCurrentDocumentMeta(type);
    const accepted = await prisma.legalConsent.findFirst({
      where: { userId: session.id, documentType: type },
      orderBy: { acceptedAt: 'desc' },
      select: { version: true },
    });
    const acceptedVersion = accepted?.version ?? null;
    result[type] = {
      current: meta.version,
      accepted: acceptedVersion,
      outdated: acceptedVersion !== meta.version,
      url: meta.url,
    };
  }

  // Manteniamo anche il flag aggregato per comodità del client
  const requiresReconsent = result.TERMS.outdated || result.PRIVACY.outdated;

  return NextResponse.json(
    {
      documents: result,
      requiresReconsent,
    },
    {
      headers: {
        // Real-time critical: dopo un publish, /auth/register deve
        // vedere SUBITO la versione nuova. Cache-Control previene cache
        // del browser, di qualsiasi reverse proxy e di Vercel Edge.
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      },
    }
  );
}, 'GET /api/legal/status');
