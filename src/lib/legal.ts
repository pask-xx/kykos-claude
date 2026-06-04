import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getPublicUrl } from '@/lib/supabase';

/**
 * Single source of truth per la versione corrente dei documenti legali.
 *
 * Le versioni attive sono lette da DB (modello LegalDocumentVersion con
 * status='active'). Per fare un bump di versione, l'admin carica un nuovo
 * PDF da /admin/legal/upload, lo pubblica, e il sistema aggiorna lo stato
 * di tutte le versioni in transazione atomica. Vedi:
 *   - src/app/api/admin/legal/route.ts (upload)
 *   - src/app/api/admin/legal/[id]/publish/route.ts (publish + archive)
 *
 * Tutti gli utenti con versione < active riceveranno una schermata di
 * re-consenso al prossimo accesso (anche per modifiche non sostanziali,
 * come da policy KYKOS). Vedi: src/app/auth/check-legal/page.tsx
 *
 * NB: questa funzione è async perché legge da DB. I call site sono tutti
 * in contesti async (route handler, test), quindi niente impatto.
 *
 * Cache: DISABILITATA (TTL=0). In pre-pilota e con traffico minimo, il
 * costo di una query extra su Prisma è trascurabile. Con la cache
 * attivata, dopo un publish l'admin vedeva la versione vecchia per
 * ~30 secondi (o peggio, in caso di multi-istanza Fluid Compute, dove
 * l'invalidazione esplicita non propaga alle altre istanze).
 * `invalidateActiveVersionsCache()` resta un no-op per compatibilità.
 * Vedi decisione: Phase 2, post-deploy 3ddb0f2.
 */
export type LegalDocumentType = 'TERMS' | 'PRIVACY';

interface ActiveVersions {
  TERMS: string;
  PRIVACY: string;
}

export async function getActiveVersions(): Promise<ActiveVersions> {
  const active = await prisma.legalDocumentVersion.findMany({
    where: { status: 'active' },
    select: { type: true, version: true },
  });

  // Default '0.0' = "nessuna versione attiva" (es. prima del data migration).
  // Il check richiedeReconsent ritornerà true in questo caso, costringendo
  // l'admin a pubblicare almeno una versione v0.1 prima del go-live.
  return {
    TERMS: active.find((v) => v.type === 'TERMS')?.version ?? '0.0',
    PRIVACY: active.find((v) => v.type === 'PRIVACY')?.version ?? '0.0',
  };
}

/**
 * No-op per compatibilità con i call site esistenti. La cache non è più
 * attiva: `getActiveVersions()` legge sempre da DB.
 */
export function invalidateActiveVersionsCache(): void {
  // intentionally empty
}

export interface DocumentMeta {
  type: LegalDocumentType;
  version: string;
  hash: string;
  url: string; // Public URL nel bucket Supabase Storage
}

const LEGAL_BUCKET = 'legal-documents';

/**
 * Path canonico di un documento legale nel bucket Supabase Storage.
 *
 * Pattern: `documents/kykos-{type}-v{version}.pdf`
 *
 * Perché `kykos-` come prefisso: l'utente che scarica il PDF si ritrova
 * con un filename leggibile ("kykos-privacy-v1.1.pdf") invece dell'opaco
 * "v1.1.pdf" ereditato dal path bucket. Niente ambiguità tra i due
 * documenti nella cartella Download. Il bucket è pubblico e l'URL
 * esposto all'utente, quindi il prefisso è anche branding.
 *
 * NB: tutti i call site (upload, download, hash, seed) DEVONO usare
 * questa funzione, NON replicare l'inline. Vedi `src/app/api/admin/legal/
 * upload/route.ts` per un esempio (correggibile in caso di regression).
 *
 * Esportata perché usata anche dal route upload (single source of truth).
 */
export function getStoragePath(type: LegalDocumentType, version: string): string {
  return `documents/kykos-${type.toLowerCase()}-v${version}.pdf`;
}

/**
 * Calcola SHA-256 del PDF corrente (versione active) scaricandolo da
 * Supabase Storage. Cache in-memory con TTL 5 min.
 *
 * Se il file non esiste in storage (es. data migration non ancora
 * eseguita), ritorna 'sha256:missing' come fallback. Il caller (route
 * /api/legal/consent) accetta questo valore come prova valida — il
 * flusso non esplode, ma l'audit Garante vedrà un hash non reale.
 *
 * Se il download fallisce per altri motivi (network, Supabase down),
 * logga e ritorna 'sha256:missing' con lo stesso fallback.
 */
const hashCache = new Map<string, { hash: string; expiresAt: number }>();
const HASH_CACHE_TTL_MS = 5 * 60 * 1000;

export async function getDocumentHash(
  type: LegalDocumentType,
  version?: string
): Promise<string> {
  const ver = version ?? (await getActiveVersions())[type];
  const cacheKey = `${type}:${ver}`;
  const cached = hashCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.hash;
  }

  const url = getPublicUrl(LEGAL_BUCKET, getStoragePath(type, ver));
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[legal] Failed to fetch ${url}: ${res.status} ${res.statusText}`);
      const fallback = 'sha256:missing';
      hashCache.set(cacheKey, { hash: fallback, expiresAt: Date.now() + HASH_CACHE_TTL_MS });
      return fallback;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const hash = createHash('sha256').update(buffer).digest('hex');
    hashCache.set(cacheKey, { hash, expiresAt: Date.now() + HASH_CACHE_TTL_MS });
    return hash;
  } catch (err) {
    console.warn(`[legal] Error fetching ${url}:`, err);
    const fallback = 'sha256:missing';
    hashCache.set(cacheKey, { hash: fallback, expiresAt: Date.now() + HASH_CACHE_TTL_MS });
    return fallback;
  }
}

/**
 * Invalida la cache hash per un type (tutte le versioni). Da chiamare dopo
 * un publish o rollback per forzare il ricalcolo.
 */
export function invalidateDocumentHashCache(type?: LegalDocumentType, version?: string): void {
  if (type && version) {
    hashCache.delete(`${type}:${version}`);
  } else if (type) {
    for (const key of hashCache.keys()) {
      if (key.startsWith(`${type}:`)) hashCache.delete(key);
    }
  } else {
    hashCache.clear();
  }
}

/**
 * Metadata del documento corrente (versione, hash, URL pubblico).
 * Usato dal client per mostrare "Termini v1.0" e aprire il PDF in modal.
 */
export async function getCurrentDocumentMeta(
  type: LegalDocumentType
): Promise<DocumentMeta> {
  const active = await getActiveVersions();
  const version = active[type];
  const hash = await getDocumentHash(type, version);
  return {
    type,
    version,
    hash,
    url: getPublicUrl(LEGAL_BUCKET, getStoragePath(type, version)),
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
  const current = (await getActiveVersions())[type];
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
// LegalConsent e un endpoint DELETE /api/legal/consent che lo valorizza.
