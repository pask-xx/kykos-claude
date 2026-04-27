'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ConfirmNoticeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <img src="/albero.svg" alt="KYKOS" className="w-12 h-12" />
          <span className="text-3xl font-bold text-secondary-600">KYKOS</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">📧</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Controlla la tua email</h2>
          <p className="text-gray-600 mb-6">
            Abbiamo inviato un link di conferma a <strong className="text-gray-800">{email}</strong>
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-800">
              <strong>Cosa fare:</strong>
            </p>
            <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
              <li>Clicca sul link che hai ricevuto via email</li>
              <li>Conferma il tuo indirizzo email</li>
              <li>Accedi al tuo account KYKOS</li>
            </ol>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Non hai ricevuto l'email? Controlla la cartella spam o{' '}
            <Link href="/auth/register" className="text-secondary-600 hover:text-secondary-700 font-medium">
              riprova la registrazione
            </Link>
          </p>

          <div className="border-t pt-6">
            <Link
              href="/auth/login"
              className="text-secondary-600 hover:text-secondary-700 font-medium text-sm"
            >
              ← Torna al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthConfirmNoticePage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary-600 to-secondary-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <img src="/albero.svg" alt="KYKOS" className="w-14 h-14" />
            <span className="text-4xl font-bold text-white">KYKOS</span>
          </Link>
          <p className="text-secondary-100 mt-3 text-lg">Dona con dignità, ricevi con gratitudine</p>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-3xl">🔐</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Account sicuro</h3>
              <p className="text-secondary-100 text-sm">La tua email viene verificata per la sicurezza</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-3xl">🎁</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Entra a far parte della community</h3>
              <p className="text-secondary-100 text-sm">Accedi a donazioni e richieste</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-secondary-200 text-sm">
          © 2024 KYKOS. Tutti i diritti riservati.
        </p>
      </div>

      {/* Right side - Confirm notice */}
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><p>Caricamento...</p></div>}>
        <ConfirmNoticeContent />
      </Suspense>
    </div>
  );
}
