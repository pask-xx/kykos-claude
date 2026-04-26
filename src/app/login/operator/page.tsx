'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OperatorLoginPage() {
  const router = useRouter();
  const [orgCode, setOrgCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/operator/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgCode, username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login fallito');
        return;
      }

      router.push('/operator/dashboard');
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-secondary-100 mt-3 text-lg">Area riservata operatori</p>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-3xl">🏢</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Accesso riservato</h3>
              <p className="text-secondary-100 text-sm">Solo operatori autorizzati dall&apos;ente</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-3xl">🔒</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Dati protetti</h3>
              <p className="text-secondary-100 text-sm">Le tue credenziali sono al sicuro</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-secondary-200 text-sm">
          © 2024 KYKOS. Tutti i diritti riservati.
        </p>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <img src="/albero.svg" alt="KYKOS" className="w-12 h-12" />
            <span className="text-3xl font-bold text-secondary-600">KYKOS</span>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accesso Operatore</h2>
            <p className="text-gray-600 mb-6">Inserisci le credenziali dell&apos;ente</p>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="orgCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Codice Ente
                </label>
                <input
                  id="orgCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition text-center text-2xl tracking-widest font-mono"
                  placeholder="1234"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition"
                  placeholder="mario.rossi"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-secondary-600 text-white font-semibold rounded-lg hover:bg-secondary-700 focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Accesso in corso...</span>
                  </>
                ) : (
                  <>
                    <span>🔑</span>
                    <span>Accedi</span>
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-gray-600 text-sm">
              Sei un utente normale?{' '}
              <Link href="/auth/login" className="text-secondary-600 hover:text-secondary-700 font-medium">
                Accedi qui
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-secondary-600 transition">
              ← Torna alla home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
