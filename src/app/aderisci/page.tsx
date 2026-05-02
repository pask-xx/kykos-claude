'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';

function getMobileOS(): 'ios' | 'android' | 'other' {
  if (typeof window === 'undefined') return 'other';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'other';
}

export default function AderisciPage() {
  const [os, setOs] = useState<'ios' | 'android' | 'other'>('other');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    setOs(getMobileOS());
    const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://kykos.it';
    const QR_URL = `${APP_URL}/aderisci`;

    QRCode.toDataURL(QR_URL, {
      width: 200,
      margin: 1,
      color: {
        dark: '#059669',
        light: '#ffffff',
      },
    }).then(setQrDataUrl);
  }, []);

  const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://kykos.it';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/albero.svg" alt="KYKOS" className="w-10 h-10" />
            <span className="text-2xl font-bold text-primary-600">KYKOS</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🤝</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Unisciti a KYKOS
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Dona con amore, ricevi con dignità. Unisciti alla rete di solidarietà che mette in contatto chi vuole donare con chi ha bisogno.
          </p>
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-2xl shadow-lg border p-8 mb-10 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Scansiona il QR Code</h2>
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* White square background */}
              <div className="w-64 h-64 bg-white rounded-xl shadow-lg border-4 border-gray-100 flex items-center justify-center p-4">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="QR Code KYKOS"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="animate-pulse text-gray-400">Generazione QR...</div>
                )}
              </div>
              {/* KYKOS logo overlay in center */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white rounded-full p-2 shadow-md">
                  <img src="/albero.svg" alt="KYKOS" className="w-12 h-12" />
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-500 text-sm">
            Scansiona per aggiungere KYKOS al tuo dispositivo
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl shadow-sm border p-8 mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            📱 Aggiungi KYKOS alla schermata Home
          </h2>

          {os === 'ios' && (
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🍎</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">iPhone / iPad</h3>
                <ol className="mt-2 space-y-3 text-gray-600 list-decimal list-inside">
                  <li>Apri Safari e vai su questo QR code</li>
                  <li>Tap sul pulsante <strong>Condividi</strong> <span className="text-gray-400 inline-block rotate-90">↗</span> in basso</li>
                  <li>Scorri e seleziona <strong>"Aggiungi alla schermata Home"</strong></li>
                  <li>Tap <strong>"Aggiungi"</strong> in alto a destra</li>
                </ol>
              </div>
            </div>
          )}

          {os === 'android' && (
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Android (Chrome)</h3>
                <ol className="mt-2 space-y-3 text-gray-600 list-decimal list-inside">
                  <li>Apri Chrome e scansiona questo QR code</li>
                  <li>Tap sui <strong>tre punti</strong> <span className="text-gray-400">⋮</span> in alto a destra</li>
                  <li>Seleziona <strong>"Aggiungi alla schermata Home"</strong></li>
                  <li>Tap <strong>"Aggiungi"</strong></li>
                </ol>
              </div>
            </div>
          )}

          {os === 'other' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Per aggiungere KYKOS alla schermata Home del tuo dispositivo:
              </p>
              <ol className="space-y-3 text-gray-600 list-decimal list-inside">
                <li>Apri il browser (Chrome, Safari, Firefox)</li>
                <li>Vai su <span className="font-mono text-primary-600">{APP_URL}/aderisci</span></li>
                <li>Sul tuo dispositivo cerca l'opzione "Aggiungi alla schermata Home" nel menu di condivisione</li>
                <li>Segui le istruzioni del tuo browser</li>
              </ol>
            </div>
          )}
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
                  Il tuo ente di riferimento (Caritas, parrocchia, associazione) ti fornirà le credenziali per accedere come <strong>Beneficiario</strong>. Potrai richiedere oggetti donati.
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