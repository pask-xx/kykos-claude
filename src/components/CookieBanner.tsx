'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Cookie banner minimo GDPR-compliant.
 *
 * KYKOS usa SOLO cookie tecnici (autenticazione JWT + Supabase session),
 * che per il Provv. Garante Privacy italiano non richiedono consenso
 * preventivo. Tuttavia il Garante richiede comunque un'informativa
 * chiara al primo accesso.
 *
 * NB: il banner è solo informativo, NON bloccante. L'utente può
 * continuare a navigare. Quando clicca "Ho capito", memorizziamo la
 * scelta in localStorage (NON in un cookie — sarebbe l'unico cookie
 * non tecnico che setteremmo, e per un banner minimale non ne vale
 * la pena).
 *
 * Cosa NON fa questo banner (per scelta, vedi REFACTOR-AUDIT e decisioni
 * pre-pilota):
 * - NON blocca lo schermo
 * - NON ha granularità per categorie (non esistono categorie opzionali)
 * - NON imposta cookie di consenso
 * - NON ha re-consenso periodico (per solo-tecnici non serve)
 * - NON ha bottone "Rifiuta" (non c'è nulla da rifiutare)
 *
 * Quando aggiungeremo analytics o marketing, questo banner andrà
 * evoluto in un CookieConsent con granularità + blocco preventivo.
 */

const STORAGE_KEY = 'kykos-cookie-ack-v1';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // SSR-safe: mostriamo il banner solo dopo l'hydration, e solo se
    // l'utente non ha già confermato.
    try {
      const acked = window.localStorage.getItem(STORAGE_KEY);
      if (!acked) setVisible(true);
    } catch {
      // localStorage non disponibile (modalità incognito restrittiva,
      // cookie disabilitati, ecc.) → mostriamo il banner comunque.
      setVisible(true);
    }
  }, []);

  const handleAck = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Ignora: se localStorage non funziona, il banner riappare al
      // prossimo accesso ma non è un bug.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Informativa cookie"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg"
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-700 flex-1">
          🍪 Questo sito utilizza <strong>solo cookie tecnici</strong> necessari
          all&apos;autenticazione (sessione utente e operatore).{' '}
          <strong>Non utilizziamo cookie di profilazione o marketing</strong>.{' '}
          <Link
            href="/cookie-policy"
            className="text-primary-600 hover:text-primary-700 underline"
          >
            Maggiori informazioni
          </Link>
        </p>
        <button
          onClick={handleAck}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition shrink-0"
        >
          Ho capito
        </button>
      </div>
    </div>
  );
}
