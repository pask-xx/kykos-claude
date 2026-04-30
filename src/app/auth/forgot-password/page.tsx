'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recupera Password - KYKOS',
  description: 'Hai dimenticato la password? Recupera l\'accesso al tuo account KYKOS.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setDevToken(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore');
        return;
      }

      setSuccess(true);

      // DEV mode - show token directly for testing
      if (data.token) {
        setDevToken(data.token);
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <img src="/albero.svg" alt="KYKOS" className="w-14 h-14" />
            <span className="text-4xl font-bold text-white">KYKOS</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-bold text-white">Hai dimenticato la password?</h2>
          <p className="text-primary-100 text-lg">
            Nessun problema. Inserisci la tua email e ti invieremo le istruzioni per reimpostare la password.
          </p>
        </div>

        <p className="relative z-10 text-primary-200 text-sm">
          © 2024 KYKOS. Tutti i diritti riservati.
        </p>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <img src="/albero.svg" alt="KYKOS" className="w-12 h-12" />
            <span className="text-3xl font-bold text-primary-600">KYKOS</span>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Recupera password</h2>
            <p className="text-gray-600 mb-6">
              Inserisci la email associata al tuo account
            </p>

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                ✓ Ti abbiamo inviato le istruzioni per reimpostare la password.
                Controlla la tua email (anche la cartella spam).
              </div>
            )}

            {devToken && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <p className="font-medium text-amber-800 mb-2">⚠️ DEV MODE - Token di reset:</p>
                <code className="text-xs break-all text-amber-900">{devToken}</code>
                <p className="mt-2">
                  <a
                    href={`/auth/reset-password?token=${devToken}`}
                    className="text-primary-600 hover:underline"
                  >
                    Clicca qui per procedere →
                  </a>
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                    placeholder="la tua@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Invio in corso...</span>
                    </>
                  ) : (
                    <>
                      <span>📧</span>
                      <span>Invia istruzioni</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {success && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push('/auth/login')}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                >
                  Torna al login
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-sm text-gray-500 hover:text-primary-600 transition">
              ← Torna al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
