'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowRight, Building2, Check, Gift, HandHeart, Heart, Lock, TriangleAlert, Users } from "lucide-react";
import SessionDashboardLink from "@/components/SessionDashboardLink";

const STAGING_DOMAINS = ['staging.kykos.it'];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "KYKOS",
  "description": "Platform for anonymous donation of objects to people in need. Dona con amore, ricevi con dignità.",
  "url": "https://kykos.it",
  "logo": "https://kykos.it/albero.svg",
  "sameAs": [],
  "contactPoint": {
    "@type": "ContactPoint",
    "description": "Supporto KYKOS",
    "email": "info@kykos.it"
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
        "text": "KYKOS è una piattaforma di donazione anonima. Chi dona non sa chi riceve e chi riceve non sa chi dona. Gli oggetti vengono pubblicati, verificati e consegnati da enti fidati (Caritas, parrocchie) nel segno della solidarietà."
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
        "text": "KYKOS promuove la solidarietà e la dignità di chi dona e di chi riceve, senza alcun profitto per gli intermediari."
      }
    }
  ]
};

export default function Home() {
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
        <div className="bg-warning-400 text-warning-900 py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2">
          <TriangleAlert className="h-4 w-4" aria-hidden="true" />
          AMBIENTE DI STAGING - Le modifiche sono in fase di test
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }}
      />
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-sm shadow-sm z-50">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center justify-between gap-2">
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <img src="/albero.svg" alt="KYKOS" className="w-10 h-10 transition-transform group-hover:scale-110" />
              <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-12" />
            </Link>

            {/* Nav buttons - always visible */}
            <div className="flex items-center gap-2">
              <SessionDashboardLink />
              <Link
                href="/manifesto"
                className="hidden sm:block px-2 py-2 text-gray-600 hover:text-primary-600 font-medium transition text-sm"
              >
                Manifesto
              </Link>
              <Link
                href="/auth/login"
                className="px-3 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 font-medium shadow-sm transition text-sm"
              >
                Accedi
              </Link>
              <Link
                href="/auth/register"
                className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold shadow-sm transition text-sm"
              >
                Registrati
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-28 text-center">
        <div className="relative inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full mb-8 shadow-xl">
          <HandHeart className="h-14 w-14 text-primary-600" aria-hidden="true" />
          <Gift className="absolute -top-1 -right-1 h-7 w-7 text-secondary-600 bg-white rounded-full p-1 shadow-md" aria-hidden="true" />
          <Users className="absolute -bottom-1 -left-1 h-7 w-7 text-primary-600 bg-white rounded-full p-1 shadow-md" aria-hidden="true" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 leading-tight text-balance">
          Dona e ricevi in modo anonimo
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
          <span className="text-primary-600 font-semibold">Chi dona</span> non sa chi riceve.{' '}
          <span className="text-secondary-600 font-semibold">Chi riceve</span> non sa chi dona.
        </p>
        <div className="flex gap-4 justify-center flex-wrap mb-4">
          <Link
            href="/auth/register?role=donor"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold text-lg shadow-lg shadow-primary-600/30 transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <Gift className="h-5 w-5" aria-hidden="true" />
            <span>Voglio donare</span>
          </Link>
          <Link
            href="/auth/register?role=recipient"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold text-lg transition focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            <Heart className="h-5 w-5" aria-hidden="true" />
            <span>Ho bisogno di aiuto</span>
          </Link>
        </div>
        <p className="text-sm text-gray-500">
          Nessun costo. Anonimato garantito.
        </p>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 text-balance">
            I valori di KYKOS
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto text-lg">
            Tre pilastri che guidano ogni donazione sulla nostra piattaforma
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="group p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary-200 transition-all">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-200 transition">
              <Lock className="h-7 w-7 text-primary-600" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Anonimato totale</h3>
            <p className="text-gray-600 leading-relaxed">
              Chi dona non sa chi riceve. Chi riceve non sa chi dona.
              La dignità è preservata attraverso l&apos;anonimato reciproco.
            </p>
          </div>
          <div className="group p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-secondary-200 transition-all">
            <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-secondary-200 transition">
              <Building2 className="h-7 w-7 text-secondary-600" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Intermediari fidati</h3>
            <p className="text-gray-600 leading-relaxed">
              Parrocchie, Caritas e associazioni del territorio verificano
              i beneficiari e gestiscono lo scambio in sicurezza.
            </p>
          </div>
          <div className="group p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-info-200 transition-all">
            <div className="w-16 h-16 bg-info-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-info-200 transition">
              <Users className="h-7 w-7 text-info-600" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Una comunità che cresce</h3>
            <p className="text-gray-600 leading-relaxed">
              Ogni donatore è riconosciuto dalla comunità KYKOS per il suo
              contributo alla solidarietà. Un grazie collettivo, non una classifica.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-balance">Come funziona</h2>
          <p className="text-gray-600 text-center mb-16 max-w-xl mx-auto text-lg">
            Un processo semplice per fare del bene in modo anonimo e sicuro
          </p>
          <div className="relative grid md:grid-cols-4 gap-8">
            {/* Curva organica che collega i 4 step (sostituisce frecce →) */}
            <svg
              className="absolute top-7 left-[12.5%] right-[12.5%] w-[75%] h-8 hidden md:block pointer-events-none"
              viewBox="0 0 300 32"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M 0 16 Q 50 0, 100 16 T 200 16 T 300 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
                fill="none"
                className="text-primary-300"
              />
            </svg>
            <div className="relative text-center">
              <div className="relative w-14 h-14 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 font-bold text-xl shadow-lg shadow-primary-600/30">1</div>
              <h4 className="font-bold text-lg text-gray-900 mb-2">Registrati</h4>
              <p className="text-gray-600 text-sm">Scegli se donare o ricevere</p>
            </div>
            <div className="relative text-center">
              <div className="relative w-14 h-14 bg-secondary-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 font-bold text-xl shadow-lg shadow-secondary-600/30">2</div>
              <h4 className="font-bold text-lg text-gray-900 mb-2">Pubblica o richiedi</h4>
              <p className="text-gray-600 text-sm">Oggetti o bisogni da soddisfare</p>
            </div>
            <div className="relative text-center">
              <div className="relative w-14 h-14 bg-warning-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 font-bold text-xl shadow-lg shadow-warning-500/30">3</div>
              <h4 className="font-bold text-lg text-gray-900 mb-2">L&apos;ente gestisce</h4>
              <p className="text-gray-600 text-sm">Verifica beneficiari e coordina</p>
            </div>
            <div className="relative text-center">
              <div className="relative w-14 h-14 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-600/30">
                <Check className="h-7 w-7" aria-hidden="true" />
              </div>
              <h4 className="font-bold text-lg text-gray-900 mb-2">Scambio anonimo</h4>
              <p className="text-gray-600 text-sm">Consegna fisica senza contatto diretto</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Enti */}
      <section className="container mx-auto px-4 py-16">
        <div className="relative bg-gradient-to-br from-warning-50 to-white rounded-3xl p-8 md:p-12 border border-warning-200 overflow-hidden">
          {/* Pattern decorativo di sfondo (cerchi concentrici) */}
          <svg
            className="absolute -right-12 -top-12 w-64 h-64 text-warning-100 opacity-60 pointer-events-none"
            viewBox="0 0 200 200"
            aria-hidden="true"
          >
            <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <div className="relative md:flex md:items-center md:gap-10">
            <div className="flex-shrink-0 mb-6 md:mb-0">
              <div className="w-20 h-20 bg-warning-100 rounded-2xl flex items-center justify-center">
                <Building2 className="h-9 w-9 text-warning-600" aria-hidden="true" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 text-balance">
                Sei un ente del territorio?
              </h2>
              <p className="text-lg text-gray-600 mb-6 md:mb-0 md:mr-6">
                Unisciti al network KYKOS per gestire donazioni e aiutare chi ne ha bisogno nel tuo territorio. La procedura è semplice e gratuita.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                href="/adesione"
                className="inline-flex items-center gap-2 px-8 py-4 bg-warning-500 text-white font-semibold rounded-xl hover:bg-warning-600 shadow-md transition focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2"
              >
                <span>Richiedi adesione</span>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-3xl p-12 md:p-16 text-center shadow-xl motion-safe:animate-kykos-fade-in-up">
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
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Colonna 1: brand */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <img src="/albero.svg" alt="KYKOS" className="w-10 h-10" style={{filter: 'brightness(0) invert(1)'}} />
                <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-8" style={{filter: 'brightness(0) invert(1)'}} />
              </div>
              <p className="text-sm italic text-gray-400">
                Dona con amore, ricevi con dignità
              </p>
            </div>
            {/* Colonna 2: link utili */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Link utili
              </h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/manifesto" className="hover:text-white transition">Manifesto</Link></li>
                <li><Link href="/faq" className="hover:text-white transition">Domande frequenti</Link></li>
                <li><Link href="/cookie-policy" className="hover:text-white transition">Cookie Policy</Link></li>
                <li><Link href="/adesione" className="hover:text-white transition">Diventa ente partner</Link></li>
              </ul>
            </div>
            {/* Colonna 3: contatti */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Contatti
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="mailto:info@kykos.it" className="hover:text-white transition inline-flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    info@kykos.it
                  </a>
                </li>
                <li>
                  <Link href="/auth/login" className="hover:text-white transition">Accedi al tuo account</Link>
                </li>
                <li>
                  <Link href="/auth/register" className="hover:text-white transition">Registrati</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-gray-800 text-center">
            <p className="text-xs text-gray-500">© 2024 KYKOS. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
