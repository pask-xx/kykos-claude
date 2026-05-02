'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  // Check token on mount
  if (!token && !loading && !success) {
    setInvalidToken(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Le password non corrispondono');
      return;
    }

    if (newPassword.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return;
    }

    if (!token) {
      setError('Token non valido');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/password/reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  if (invalidToken) {
    return (
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔒</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Link non valido</h1>
        <p className="text-gray-600 mb-6">
          Questo link di reset non è valido o è scaduto. Richiedi un nuovo reset della password.
        </p>
        <Link
          href="/auth/login"
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium inline-block"
        >
          Torna al login
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Password reimpostata!</h1>
        <p className="text-gray-600 mb-6">
          La tua password è stata modificata con successo. Ora puoi accedere con la nuova password.
        </p>
        <Link
          href="/auth/login"
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium inline-block"
        >
          Accedi
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Nuova password</h2>
      <p className="text-gray-600 mb-6">Inserisci la tua nuova password</p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Nuova password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Conferma nuova password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full py-3.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Reimpostazione...</span>
            </>
          ) : (
            <>
              <span>🔑</span>
              <span>Reimposta password</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/auth/login" className="text-sm text-gray-500 hover:text-primary-600 transition">
          ← Torna al login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-14" />
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-bold text-white">Reimposta la tua password</h2>
          <p className="text-primary-100 text-lg">
            Inserisci la nuova password per il tuo account KYKOS.
          </p>
        </div>

        <p className="relative z-10 text-primary-200 text-sm">
          © 2024 KYKOS. Tutti i diritti riservati.
        </p>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        {/* Mobile logo */}
        <div className="lg:hidden absolute top-4 left-4 flex items-center gap-3">
          <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-12" />
        </div>

        <Suspense fallback={
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border text-center">
            <p className="text-gray-500">Caricamento...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
