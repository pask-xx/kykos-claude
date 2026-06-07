'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui';

/**
 * Global error boundary — cattura errori NON gestiti in qualsiasi route
 * server o client. Appare al posto del contenuto della pagina.
 *
 * Next.js richiede che error.tsx sia un Client Component: riceve
 * `error` (istanza di Error) e `reset` (funzione che ritenta il render).
 *
 * Cosa NON facciamo qui:
 * - Loggiamo l'errore in console per debugging (in produzione sarà inviato
 *   a un servizio tipo Sentry; TODO post-pilota).
 * - Mostriamo il messaggio tecnico all'utente (solo messaggio generico).
 * - Blocchiamo l'app: il bottone "Riprova" chiama reset(), "Torna alla
 *   home" linka a / per fallback sicuro.
 *
 * Primitive usati:
 * - <Button> (NON <button className="bg-primary-600 ..."> raw)
 * - Icona lucide AlertOctagon (NON emoji ❌)
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO post-pilota: invio a servizio logging (Sentry, Logflare, ecc.)
    // Per ora solo console per ispezione dev.
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
      <AlertOctagon className="h-16 w-16 text-error-500" aria-hidden="true" />
      <div className="text-center max-w-md space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Qualcosa è andato storto
        </h1>
        <p className="text-sm text-gray-500">
          Si è verificato un errore inatteso. Riprova, oppure torna alla home
          e riparti da lì.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 font-mono mt-2">
            ID errore: {error.digest}
          </p>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="primary" onClick={reset}>
          Riprova
        </Button>
        <Link href="/">
          <Button variant="secondary">Torna alla home</Button>
        </Link>
      </div>
    </div>
  );
}
