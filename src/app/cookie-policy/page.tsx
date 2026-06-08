import Link from 'next/link';
import { Metadata } from 'next';
import { Check } from 'lucide-react';
import SessionDashboardLink from '@/components/SessionDashboardLink';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Cookie Policy - KYKOS',
  description:
    'KYKOS utilizza esclusivamente cookie tecnici necessari al funzionamento del servizio. Nessun cookie di profilazione o marketing.',
  keywords: ['cookie policy KYKOS', 'cookie tecnici', 'privacy'],
  alternates: {
    canonical: 'https://kykos.it/cookie-policy',
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Cookie Policy - KYKOS',
    description: 'KYKOS utilizza esclusivamente cookie tecnici necessari al funzionamento del servizio.',
    type: 'website',
    url: 'https://kykos.it/cookie-policy',
  },
};

const cookiePolicyJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Cookie Policy - KYKOS',
  description: 'KYKOS utilizza esclusivamente cookie tecnici necessari al funzionamento del servizio.',
  url: 'https://kykos.it/cookie-policy',
  inLanguage: 'it-IT',
  isPartOf: {
    '@type': 'WebSite',
    name: 'KYKOS',
    url: 'https://kykos.it',
  },
  about: {
    '@type': 'Thing',
    name: 'Cookie Policy',
    description: 'Informativa sui cookie tecnici utilizzati da KYKOS.',
  },
};

interface CookieInfo {
  name: string;
  purpose: string;
  duration: string;
  type: 'tecnico' | 'sessione';
  provider: 'KYKOS' | 'Supabase';
}

const COOKIES: CookieInfo[] = [
  {
    name: 'session',
    purpose:
      'Token JWT firmato che identifica la sessione di un utente autenticato (donatore, ricevente, amministratore). Necessario per autenticare le richieste API.',
    duration: '7 giorni',
    type: 'tecnico',
    provider: 'KYKOS',
  },
  {
    name: 'operator_session',
    purpose:
      'Token JWT firmato che identifica la sessione di un operatore d’ente autenticato. Necessario per autenticare le richieste API lato operatore.',
    duration: '7 giorni',
    type: 'tecnico',
    provider: 'KYKOS',
  },
  {
    name: 'sb-access-token',
    purpose:
      'Token di accesso Supabase Auth. Utilizzato per identificare l’utente presso i servizi Supabase (Auth, Database con RLS, Storage).',
    duration: '7 giorni',
    type: 'tecnico',
    provider: 'Supabase',
  },
  {
    name: 'sb-refresh-token',
    purpose:
      'Token di refresh Supabase Auth. Permette di ottenere un nuovo access token alla scadenza, senza richiedere un nuovo login.',
    duration: '7 giorni',
    type: 'tecnico',
    provider: 'Supabase',
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <JsonLd data={cookiePolicyJsonLd} />
      {/* Header (pattern coerente con manifesto) */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img src="/albero.svg" alt="KYKOS" className="h-14" />
              <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-14" />
            </Link>
            <nav className="flex items-center gap-4">
              <SessionDashboardLink />
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-primary-600 font-medium"
              >
                Accedi
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cookie Policy</h1>
        <p className="text-sm text-gray-500 mb-8">
          Ultimo aggiornamento: giugno 2026
        </p>

        <section className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Cosa sono i cookie
          </h2>
          <p className="text-gray-700 leading-relaxed">
            I cookie sono piccoli file di testo che i siti web visitati inviano
            al terminale dell&apos;utente, dove vengono memorizzati per essere
            ritrasmessi agli stessi siti alla successiva visita. I cookie
            possono essere installati dal sito che si sta visitando
            (cookie di prima parte) o da siti diversi (cookie di terze parti).
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Quali cookie utilizziamo
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            KYKOS utilizza <strong>esclusivamente cookie tecnici</strong>{' '}
            necessari al funzionamento del servizio. In particolare:
          </p>
          <ul className="space-y-2 text-gray-700 mb-4">
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong>Cookie tecnici di sessione</strong>: necessari per
                autenticare l&apos;utente e mantenere attiva la sessione.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong>Cookie tecnici di sicurezza</strong>: necessari per
                proteggere la sessione da attacchi CSRF.
              </span>
            </li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            <strong>Non utilizziamo</strong> cookie di profilazione, marketing,
            analytics di terze parti, o altri strumenti di tracciamento.
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Elenco dettagliato dei cookie
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-3 font-semibold text-gray-900">
                    Nome
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-gray-900">
                    Fornitore
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-gray-900">
                    Tipo
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-gray-900">
                    Durata
                  </th>
                </tr>
              </thead>
              <tbody>
                {COOKIES.map(c => (
                  <tr key={c.name} className="border-b last:border-b-0">
                    <td className="py-3 pr-3 font-mono text-xs text-gray-900 align-top">
                      {c.name}
                    </td>
                    <td className="py-3 pr-3 text-gray-700 align-top">
                      {c.provider}
                    </td>
                    <td className="py-3 pr-3 text-gray-700 align-top">
                      {c.type}
                    </td>
                    <td className="py-3 pr-3 text-gray-700 align-top">
                      {c.duration}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Caratteristiche dei cookie tecnici
          </h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            I cookie tecnici sopra elencati:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>
              Sono installati <strong>automaticamente</strong> al primo accesso
              e non richiedono consenso preventivo ai sensi del
              Provv. Garante Privacy 10 giugno 2021.
            </li>
            <li>
              Sono marcati <code>httpOnly</code> (non accessibili da JavaScript
              lato client) e <code>secure</code> in produzione, per mitigare
              attacchi XSS e man-in-the-middle.
            </li>
            <li>
              Hanno <code>sameSite=lax</code> per mitigare attacchi CSRF.
            </li>
            <li>
              Hanno durata limitata (7 giorni) e vengono rinnovati a ogni
              login.
            </li>
          </ul>
        </section>

        <section className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Come gestire i cookie
          </h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            Poiché utilizziamo solo cookie tecnici necessari, la loro
            disabilitazione tramite le impostazioni del browser
            potrebbe compromettere il funzionamento del servizio
            (es. impedire il login).
          </p>
          <p className="text-gray-700 leading-relaxed">
            Per modificare le preferenze dei cookie del proprio browser:
            <br />- <strong>Chrome</strong>: Impostazioni → Privacy e sicurezza → Cookie
            <br />- <strong>Firefox</strong>: Impostazioni → Privacy e sicurezza → Cookie
            <br />- <strong>Safari</strong>: Preferenze → Privacy → Cookie
            <br />- <strong>Edge</strong>: Impostazioni → Cookie e autorizzazioni del sito
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Per saperne di più
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Per informazioni complete sul trattamento dei dati personali,
            consulta la nostra{' '}
            <Link
              href="/api/legal/privacy"
              className="text-primary-600 hover:text-primary-700 underline"
            >
              Informativa Privacy
            </Link>
            . Per qualsiasi domanda, contattaci all&apos;indirizzo indicato
            nella privacy policy.
          </p>
        </section>

        <div className="text-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700"
          >
            Torna alla home
          </Link>
        </div>
      </main>
    </div>
  );
}
