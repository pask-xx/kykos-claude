import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';
import { requiresReconsent } from '@/lib/legal';

/**
 * GET /api/legal/check
 *
 * Ritorna `{ requiresReconsent: true|false }` per l'utente loggato.
 *
 * Pensato per essere chiamato da un useEffect al mount di pagine "sensibili"
 * (es. dashboard, settings, prima di certe azioni). Se true, il client
 * redirige a /auth/check-legal.
 *
 * Alternativa: invece di una route dedicata, /api/legal/status fa lo stesso
 * check. Le due route coesistono perché /check è leggera (un bool) e
 * pensata per polling/redirect, mentre /status ritorna i dettagli completi
 * per la UI.
 */
export const GET = withErrorHandler(async () => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const needs = await requiresReconsent(session.id);
  return NextResponse.json(
    { requiresReconsent: needs },
    {
      headers: {
        // Versioni legali sono real-time critical: nessuna cache (browser,
        // CDN, Vercel). Anche se il client chiama subito dopo un publish,
        // deve vedere lo stato aggiornato.
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      },
    }
  );
}, 'GET /api/legal/check');
