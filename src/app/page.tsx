'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import SessionDashboardLink from "@/components/SessionDashboardLink";

const STAGING_DOMAINS = ['staging.kykos.it'];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "KYKOS",
  "description": "Platform for anonymous donation of objects to people in need. Dona con amore, ricevi con dignità.",
  "url": "https://kykos.app",
  "logo": "https://kykos.app/albero.svg",
  "sameAs": [],
  "contactPoint": {
    "@type": "ContactPoint",
    "description": "Supporto KYKOS",
    "email": "info@kykos.app"
  }
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Come funziona KYKOS?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "KYKOS è una piattaforma di donazione anonima. Chi dona non sa chi riceve e chi riceve non sa chi dona. Gli oggetti vengono pubblicati, verificati da enti fidati (Caritas, parrocchie) e consegnati con un contributo simbolico di 1-2€."
      }
    },
    {
      "@type": "Question",
      "name": "KYKOS è realmente anonimo?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sì, KYKOS garantisce l'anonimato totale. Donatori e riceventi non si conoscono. Gli intermediari fidati gestiscono la verifica e il coordinamento."
      }
    },
    {
      "@type": "Question",
      "name": "Quanto costa ricevere un oggetto?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Il contributo simbolico richiesto è di 1-2€ per coprire i costi logistici. Nessun profitto è generato dagli intermediari."
      }
    }
  ]
};

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isStaging, setIsStaging] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    const isStagingEnv = STAGING_DOMAINS.some(d => hostname.includes(d));
    setIsStaging(isStagingEnv);
  }, []);

  return (
    <>
      {/* Staging Banner */}
      {isStaging && (
        <div className="bg-amber-400 text-amber-900 py-2 px-4 text-center text-sm font-medium">
          ⚠️ AMBIENTE DI STAGING - Le modifiche sono in fase di test
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }}
      />
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-sm shadow-sm z-50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <img src="/albero.svg" alt="KYKOS" className="w-12 h-12 transition-transform group-hover:scale-110" />
              <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-14" />
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-3">
              <SessionDashboardLink />
              <Link
                href="/manifesto"
                className="px-3 py-2 text-gray-600 hover:text-primary-600 font-medium transition"
              >
                Manifesto
              </Link>
              <Link
                href="/auth/login"
                className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 font-medium shadow-sm transition"
              >
                Accedi
              </Link>
              <Link
                href="/auth/register"
                className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold shadow-sm transition"
              >
                Registrati
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden w-10 h-10 flex items-center justify-center text-gray-600 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </nav>

          {/* Mobile nav dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-2 border-t border-gray-100 pt-4">
              <Link
                href="/manifesto"
                className="block px-4 py-3 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg font-medium transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Manifesto
              </Link>
              <Link
                href="/auth/login"
                className="block px-4 py-3 text-secondary-600 hover:bg-gray-50 rounded-lg font-medium transition font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Accedi
              </Link>
              <Link
                href="/auth/register"
                className="block px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold transition text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Registrati
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-28 text-center">
        <div className="inline-flex items-center justify-center w-32 h-32 bg-primary-100 rounded-full mb-8 shadow-xl">
          <img src="/albero.svg" alt="KYKOS" className="w-24 h-24" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Dona con <span className="text-primary-600">amore</span>,
          <br />
          ricevi con <span className="text-secondary-600">dignità</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
          Anonimato totale per donatori e riceventi.
          <br className="hidden md:block" />
          Chi dona non sa chi riceve. Chi riceve non sa chi dona.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/auth/register?role=donor"
            className="group px-8 py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold text-lg shadow-lg shadow-primary-600/30 transition flex items-center gap-2"
          >
            <span>Voglio donare</span>
            <span className="text-xl">🎁</span>
          </Link>
          <Link
            href="/auth/register?role=recipient"
            className="group px-8 py-4 border-2 border-secondary-600 text-secondary-600 rounded-xl hover:bg-secondary-50 font-semibold text-lg transition flex items-center gap-2"
          >
            <span>Ho bisogno di aiuto</span>
            <span className="text-xl">🙏</span>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="group p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary-200 transition-all">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-200 transition">
              <span className="text-3xl">🔒</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Anonimato totale</h3>
            <p className="text-gray-600 leading-relaxed">
              Chi dona non sa chi riceve. Chi riceve non sa chi dona.
              La dignità è preservata attraverso l&apos;anonimato reciproco.
            </p>
          </div>
          <div className="group p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-secondary-200 transition-all">
            <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-secondary-200 transition">
              <span className="text-3xl">🏢</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Intermediari fidati</h3>
            <p className="text-gray-600 leading-relaxed">
              Centri Caritas, parrocchie e associazioni verificano i riceventi
              e gestiscono lo scambio in sicurezza.
            </p>
          </div>
          <div className="group p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-amber-200 transition-all">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-200 transition">
              <span className="text-3xl">🏆</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Incentivi morali</h3>
            <p className="text-gray-600 leading-relaxed">
              Livelli di donatore (Bronzo, Argento, Oro...) per ringraziare
              chi contribuisce alla comunità.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Come funziona</h2>
          <p className="text-gray-600 text-center mb-16 max-w-xl mx-auto text-lg">
            Un processo semplice per fare del bene in modo anonimo e sicuro
          </p>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="relative text-center">
              <div className="w-14 h-14 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 font-bold text-xl shadow-lg shadow-primary-600/30">1</div>
              <h4 className="font-bold text-lg text-gray-900 mb-2">Registrati</h4>
              <p className="text-gray-600">Scegli se donare o ricevere</p>
              <div className="hidden md:block absolute top-7 -right-4 transform translate-x-1/2">
                <span className="text-2xl text-gray-300">→</span>
              </div>
            </div>
            <div className="relative text-center">
              <div className="w-14 h-14 bg-secondary-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 font-bold text-xl shadow-lg shadow-secondary-600/30">2</div>
              <h4 className="font-bold text-lg text-gray-900 mb-2">Pubblica o richiedi</h4>
              <p className="text-gray-600">Oggetti da donare o bisogni</p>
              <div className="hidden md:block absolute top-7 -right-4 transform translate-x-1/2">
                <span className="text-2xl text-gray-300">→</span>
              </div>
            </div>
            <div className="relative text-center">
              <div className="w-14 h-14 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 font-bold text-xl shadow-lg shadow-amber-500/30">3</div>
              <h4 className="font-bold text-lg text-gray-900 mb-2">L&apos;ente gestisce</h4>
              <p className="text-gray-600">Verifica e coordina</p>
              <div className="hidden md:block absolute top-7 -right-4 transform translate-x-1/2">
                <span className="text-2xl text-gray-300">→</span>
              </div>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 font-bold text-xl shadow-lg shadow-green-600/30">4</div>
              <h4 className="font-bold text-lg text-gray-900 mb-2">Scambio anonimo</h4>
              <p className="text-gray-600">Un contributo simbolico (1-2€)</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Enti */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-amber-50 to-white rounded-3xl p-8 md:p-12 border border-amber-200">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🏢</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Sei un ente del territorio?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Unisciti al network KYKOS per gestire donazioni e aiutare chi ne ha bisogno nel tuo territorio. La procedura è semplice e gratuita.
            </p>
            <Link
              href="/adesione"
              className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 shadow-md transition"
            >
              <span>Richiedi adesione</span>
              <span className="text-xl">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-3xl p-12 md:p-16 text-center shadow-xl">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
            <img src="/albero.svg" alt="KYKOS" className="w-14 h-14" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Unisciti alla rete KYKOS
          </h2>
          <p className="text-primary-100 mb-8 max-w-lg mx-auto text-lg">
            Partecipa anche tu a questa rete di solidarietà, rispetto e sostenibilità.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 shadow-md transition"
            >
              Inizia ora
            </Link>
            <Link
              href="/manifesto"
              className="px-8 py-4 border-2 border-white/50 text-white font-semibold rounded-xl hover:bg-white/10 transition"
            >
              Leggi il manifesto
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/albero.svg" alt="KYKOS" className="w-10 h-10" />
            <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-8" />
          </div>
          <p className="text-sm italic mb-2">Dona con amore, ricevi con dignità</p>
          <div className="flex justify-center gap-6 mt-6 text-sm">
            <Link href="/manifesto" className="hover:text-white transition">Manifesto</Link>
            <Link href="/auth/login" className="hover:text-white transition">Accedi</Link>
            <Link href="/auth/register" className="hover:text-white transition">Registrati</Link>
          </div>
          <p className="text-xs mt-8 text-gray-500">© 2024 KYKOS. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
    </>
  );
}
