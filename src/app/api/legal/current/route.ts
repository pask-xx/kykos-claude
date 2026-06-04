import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api';
import { getCurrentDocumentMeta, type LegalDocumentType } from '@/lib/legal';

/**
 * GET /api/legal/current
 *
 * Ritorna i METADATA dei documenti legali correnti (versione + URL pubblico
 * del PDF su Supabase Storage). NON richiede autenticazione — è pubblica.
 *
 * Usata da pagine pubbliche (es. /auth/register) per mostrare la versione
 * corrente del documento e linkare il PDF giusto. L'utente NON ha ancora
 * una sessione qui, quindi non ha senso chiamare /api/legal/status (che è
 * privata e ritorna anche lo stato del suo consenso).
 *
 * Risposta:
 * {
 *   documents: {
 *     PRIVACY: { version: '1.1', url: 'https://...' },
 *     TERMS:   { version: '1.0', url: 'https://...' }
 *   }
 * }
 *
 * Cache-Control: no-store (vedi commento in src/lib/legal.ts — pre-pilota,
 * la cache non è affidabile con Fluid Compute multi-istanza).
 */
export const GET = withErrorHandler(async () => {
  const types: LegalDocumentType[] = ['PRIVACY', 'TERMS'];
  const documents: Record<LegalDocumentType, { version: string; url: string }> = {
    PRIVACY: {} as never,
    TERMS: {} as never,
  };

  for (const type of types) {
    const meta = await getCurrentDocumentMeta(type);
    documents[type] = { version: meta.version, url: meta.url };
  }

  return NextResponse.json(
    { documents },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      },
    }
  );
}, 'GET /api/legal/current');
