'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import InstallAppBanner from '@/components/InstallAppBanner';

export default function AderisciPage() {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://kykos.it';
    QRCode.toDataURL(`${APP_URL}/aderisci`, {
      width: 200,
      margin: 1,
      color: {
        dark: '#059669',
        light: '#ffffff',
      },
    }).then(setQrDataUrl);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/albero.svg" alt="KYKOS" className="h-10" />
            <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-14" />
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <img src="/albero.svg" alt="KYKOS" className="w-12 h-12" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Unisciti a KYKOS
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Dona con amore, ricevi con dignità. Unisciti alla rete di solidarietà che mette in contatto chi vuole donare con chi ha bisogno.
          </p>
        </div>

        {/* Install App Banner */}
        <div className="mb-10">
          <InstallAppBanner />
        </div>

        {/* How to Register */}
        <div className="bg-white rounded-2xl shadow-sm border p-8 mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            📝 Come registrarti
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🎁</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Se vuoi donare</h3>
                <p className="text-gray-600 text-sm">
                  Registrati come <strong>Donatore</strong>. Potrai inserire oggetti che non usi più e che possono essere utili ad altri. La donazione è anonima e gestita tramite enti fidati.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🤲</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Se hai bisogno di aiuto</h3>
                <p className="text-gray-600 text-sm">
                  Il tuo ente di riferimento (Caritas, parrocchia, associazione) ti autorizzerà come <strong>Beneficiario</strong>. Potrai richiedere oggetti donati.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500">
              Non sai cosa scegliere? <Link href="/manifesto" className="text-primary-600 hover:underline">Scopri come funziona KYKOS</Link>
            </p>
          </div>
        </div>

        {/* Manifesto Quote */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-center text-white">
          <p className="text-2xl font-serif italic mb-2">"Dona con amore, ricevi con dignità"</p>
          <p className="text-primary-100 text-sm">Il manifesto KYKOS</p>
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link
            href="/auth/register"
            className="inline-block px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
          >
            Registrati ora
          </Link>
        </div>

        {/* Print section - only shows when printing */}
        <div className="hidden print:block mt-12">
          <div className="flex items-center justify-center mb-8">
            <img src="/albero.svg" alt="KYKOS" className="h-16 mr-4" />
            <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-16" />
          </div>
          <div className="text-center mb-8">
            <p className="text-xl text-gray-600">Dona con amore, ricevi con dignità</p>
            <p className="text-gray-500 mt-2">
              La rete di solidarietà che mette in contatto chi vuole donare con chi ha bisogno.
              Anonimato totale, enti fidati, sostenibilità.
            </p>
          </div>
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-48 h-48 bg-white rounded-xl shadow-lg border flex items-center justify-center p-2">
                {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-full h-full" />}
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white rounded-full p-1">
                  <img src="/albero.svg" alt="KYKOS" className="h-8" />
                </div>
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-gray-500">
            <p>Scansiona il QR Code o visita <strong>kykos.it/aderisci</strong></p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t">
        <p className="text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} KYKOS. Dona con amore, ricevi con dignità.
        </p>
      </footer>
    </div>
  );
}
