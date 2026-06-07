import { Spinner } from '@/components/ui';

/**
 * Global loading state — mostrato durante la navigazione automatica di
 * Next.js tra route. Appare istantaneamente, viene sostituito dal contenuto
 * della route di destinazione quando è pronto.
 *
 * Primitive usati:
 * - <Spinner size="lg" /> dal design system (NON `animate-spin h-10 w-10
 *   border-b-2 border-primary-600` raw)
 * - Layout full-page centrato con min-h-screen per coprire viewport
 *
 * No `'use client'`: Next.js richiede che loading.tsx sia un Server Component
 * (rende sul server, idrata sul client solo lo <Spinner>).
 */
export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-sm text-gray-500">Caricamento…</p>
    </div>
  );
}
