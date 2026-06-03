import { createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { prisma } from '@/lib/prisma';

/**
 * Single source of truth per la versione corrente dei documenti legali.
 *
 * Quando si fa un bump:
 * 1. Aggiornare il PDF e rinominarlo (es. terms-v1.0.pdf -> terms-v1.1.pdf)
 * 2. Aggiornare la costante qui sotto
 * 3. Aggiungere nota in CHANGELOG.md ("Cosa è cambiato")
 *
 * Tutti gli utenti con version < CURRENT riceveranno una schermata di
 * re-consenso al prossimo accesso (anche per modifiche non sostanziali,
 * come da policy KYKOS). Vedi: src/app/auth/check-legal/page.tsx
 */
export const CURRENT_LEGAL_VERSIONS = {
  TERMS: '1.0',
  PRIVACY: '1.0',
} as const;

export type LegalDocumentType = keyof typeof CURRENT_LEGAL_VERSIONS;

export interface DocumentMeta {
  type: LegalDocumentType;
  version: string;
  hash: string;
  url: string; // Path pubblico servito da /public/legal/
}

/**
 * Path fisico al PDF su disco. In dev = `<root>/public/legal/{name}.pdf`.
 * In produzione (Vercel) i file in `public/` sono bundled, ma `readFileSync`
 * continua a funzionare perché il fs contiene lo snapshot.
 *
 * NB: se la cache di Vercel ha una versione vecchia del PDF, l'hash cambia
 * e il re-consenso scatterà correttamente (by design).
 */
function getPdfPath(type: LegalDocumentType, version: string): string {
  return join(process.cwd(), 'public', 'legal', `${type.toLowerCase()}-v${version}.pdf`);
}

/**
 * Calcola SHA-256 del PDF corrente. Se il file non esiste, ritorna hash
 * fittizio "missing" — il caller deciderà se bloccare o procedere.
 */
export function getDocumentHash(type: LegalDocumentType, version?: string): string {
  const v = version ?? CURRENT_LEGAL_VERSIONS[type];
  const path = getPdfPath(type, v);
  if (!existsSync(path)) {
    // In dev/test il PDF potrebbe non essere stato ancora creato.
    // Ritorniamo un hash stabile così l'API non esplode; in produzione
    // il check di esistenza è già garantito dal deploy.
    return 'sha256:missing';
  }
  const buffer = readFileSync(path);
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Metadata del documento corrente: versione, hash, URL pubblico.
 * Usato dal client per mostrare "Termini v1.0" e aprire il PDF in nuova tab.
 */
export function getCurrentDocumentMeta(type: LegalDocumentType): DocumentMeta {
  const version = CURRENT_LEGAL_VERSIONS[type];
  return {
    type,
    version,
    hash: getDocumentHash(type, version),
    url: `/legal/${type.toLowerCase()}-v${version}.pdf`,
  };
}

/**
 * True se l'utente ha una entry di consenso valida per la versione corrente
 * del documento. False se:
 * - non ha mai accettato, o
 * - ha accettato una versione precedente (richiesto re-consenso)
 */
export async function hasAcceptedCurrentVersion(
  userId: string,
  type: LegalDocumentType
): Promise<boolean> {
  const current = CURRENT_LEGAL_VERSIONS[type];
  const consent = await prisma.legalConsent.findUnique({
    where: {
      userId_documentType_version: {
        userId,
        documentType: type,
        version: current,
      },
    },
    select: { id: true },
  });
  return !!consent;
}

/**
 * True se l'utente ha consensi outdated su QUALSIASI documento legale.
 * Usato dal flow post-login per decidere se rimandare a /auth/check-legal.
 */
export async function requiresReconsent(userId: string): Promise<boolean> {
  const checks = await Promise.all([
    hasAcceptedCurrentVersion(userId, 'TERMS'),
    hasAcceptedCurrentVersion(userId, 'PRIVACY'),
  ]);
  return checks.some((accepted) => !accepted);
}

/**
 * Estrae IP e User-Agent dalla Request per il log del consenso.
 * Su Vercel l'IP è in `x-forwarded-for` (potrebbe essere una lista, prendiamo il primo).
 * Se manca, ritorniamo null — l'accettazione resta valida anche senza IP.
 */
export function extractRequestMetadata(request: Request): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const xff = request.headers.get('x-forwarded-for');
  const ipAddress = xff ? xff.split(',')[0]?.trim() ?? null : null;
  const userAgent = request.headers.get('user-agent');
  return { ipAddress, userAgent };
}

// TODO post-MVP: diritto di recesso del consenso (GDPR art. 7(3)).
// L'utente dovrà poter ritirare il consenso via profilo. Placeholder qui.
// L'implementazione sarà: aggiungere `withdrawnAt: DateTime?` al modello
// e un endpoint DELETE /api/legal/consent che lo valorizza.
