'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conferma Email - KYKOS',
  description: 'Conferma il tuo indirizzo email per attivare l\'account KYKOS.',
  robots: {
    index: false,
    follow: true,
  },
};

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleConfirm = async () => {
    if (!token) {
      setStatus('error');
      setMessage('Token mancante');
      return;
    }

    setStatus('loading');
    setMessage('Confermo la tua email...');

    try {
      const res = await fetch('/api/auth/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Email confermata con successo!');
      } else {
        setStatus('error');
        setMessage(data.error || 'Errore durante la conferma');
      }
    } catch {
      setStatus('error');
      setMessage('Errore di connessione');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <img src="/albero.svg" alt="KYKOS" className="w-12 h-12" />
          <span className="text-3xl font-bold text-secondary-600">KYKOS</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          {status === 'idle' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📧</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Conferma il tuo indirizzo email</h2>
              <p className="text-gray-600 mb-6">
                Clicca sul pulsante qui sotto per attivare il tuo account KYKOS.
              </p>
              <button
                onClick={handleConfirm}
                className="w-full bg-secondary-600 text-white py-3 rounded-lg font-medium hover:bg-secondary-700 transition"
              >
                Conferma email
              </button>
            </>
          )}

          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl animate-spin">⏳</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Conferma in corso</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email confermata!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link
                href="/auth/login"
                className="inline-block bg-secondary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-secondary-700 transition"
              >
                Accedi ora
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">❌</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Errore</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="border-t pt-6">
                <Link
                  href="/auth/register"
                  className="text-secondary-600 hover:text-secondary-700 font-medium text-sm"
                >
                  Torna alla registrazione
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmNoticeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const hasToken = searchParams.has('token');

  // If token is present, show confirmation content
  if (hasToken) {
    return <ConfirmContent />;
  }

  // Otherwise show the notice page
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
          {email && (
            <p className="text-gray-600 mb-6">
              Abbiamo inviato un link di conferma a <strong className="text-gray-800">{email}</strong>
            </p>
          )}

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

export default function AuthConfirmPage() {
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
