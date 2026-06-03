import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';
import {
  CURRENT_LEGAL_VERSIONS,
  getCurrentDocumentMeta,
  hasAcceptedCurrentVersion,
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

  for (const type of Object.keys(CURRENT_LEGAL_VERSIONS) as LegalDocumentType[]) {
    const meta = getCurrentDocumentMeta(type);
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

  return NextResponse.json({
    documents: result,
    requiresReconsent,
  });
}, 'GET /api/legal/status');
