import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';
import {
  CURRENT_LEGAL_VERSIONS,
  getDocumentHash,
  extractRequestMetadata,
  type LegalDocumentType,
} from '@/lib/legal';

const VALID_TYPES: LegalDocumentType[] = ['TERMS', 'PRIVACY'];

/**
 * POST /api/legal/consent
 *
 * Registra l'accettazione di un documento legale (Privacy o Terms).
 *
 * Body: { documentType: 'TERMS' | 'PRIVACY' }
 *
 * La versione e l'hash sono derivati lato server da CURRENT_LEGAL_VERSIONS
 * e getDocumentHash() — il client non può forzare una versione vecchia o un
 * hash inventato. Il consenso viene registrato con IP e User-Agent per
 * prova legale in caso di audit Garante.
 *
 * Idempotente: stesso (userId, documentType, version) viene dedupato da
 * @@unique([userId, documentType, version]). Niente P2002 → niente errore
 * al client che doppio-clicca per sbaglio.
 */
export const POST = withErrorHandler(async (request: Request) => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const documentType = body?.documentType as LegalDocumentType | undefined;

  if (!documentType || !VALID_TYPES.includes(documentType)) {
    return NextResponse.json(
      { error: 'documentType mancante o non valido (atteso: TERMS o PRIVACY)' },
      { status: 400 }
    );
  }

  const version = CURRENT_LEGAL_VERSIONS[documentType];
  const documentHash = getDocumentHash(documentType);
  const { ipAddress, userAgent } = extractRequestMetadata(request);

  // upsert (non create) per gestire il double-click idempotente.
  // L'update di ipAddress/userAgent su un consenso già esistente non è
  // rilevante legalmente: ciò che conta è l'acceptedAt originale, e noi
  // NON lo tocchiamo. Le colonne aggiornate sono solo metadata accessori.
  await prisma.legalConsent.upsert({
    where: {
      userId_documentType_version: {
        userId: session.id,
        documentType,
        version,
      },
    },
    create: {
      userId: session.id,
      documentType,
      version,
      documentHash,
      ipAddress,
      userAgent,
    },
    update: {
      // No-op: ipAddress/userAgent/hash sono "first-write-wins" per
      // mantenere la prova originaria intatta.
    },
  });

  return NextResponse.json({
    documentType,
    version,
    acceptedAt: new Date().toISOString(),
  });
}, 'POST /api/legal/consent');
