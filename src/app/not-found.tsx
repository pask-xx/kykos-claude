import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';

/**
 * Global 404 page — mostrata quando l'utente naviga a una route che non
 * esiste (es. typo nell'URL, link vecchio, risorsa rimossa).
 *
 * Next.js la mostra automaticamente al posto del contenuto della pagina.
 * Non richiede 'use client' (è una static page).
 *
 * Primitive usati:
 * - <EmptyState> con icon={FileQuestion} (lucide, NON emoji 🔍)
 * - <Button> per il CTA
 *
 * Cosa NON facciamo:
 * - Non aggiungiamo <meta name="robots" content="noindex"> nel layout
 *   (Next.js lo fa già di default per le pagine not-found).
 */
export default function GlobalNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <EmptyState
        icon={FileQuestion}
        title="Pagina non trovata"
        description="La pagina che stai cercando non esiste o è stata spostata. Controlla l'URL o torna alla home per ripartire."
        action={
          <Link href="/">
            <Button variant="primary">Torna alla home</Button>
          </Link>
        }
      />
    </div>
  );
}
