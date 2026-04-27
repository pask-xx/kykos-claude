'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!email) {
      router.push('/auth/register');
      return;
    }

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otpCode.length !== 6) {
      setError('Il codice deve essere di 6 cifre');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verifica fallita');
        return;
      }

      // Redirect based on role
      const redirectPath = data.user.role === 'DONOR'
        ? '/donor/dashboard'
        : data.user.role === 'RECIPIENT'
          ? '/recipient/dashboard'
          : '/intermediary/dashboard';

      router.push(redirectPath);
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setTimeLeft(600);
        setCanResend(false);
        setOtpCode('');
        setError('');
      } else {
        const data = await res.json();
        setError(data.error || 'Errore nel invio del codice');
      }
    } catch {
      setError('Errore di connessione');
    }
  };

  const handleOtpChange = (value: string) => {
    // Only allow numbers
    const numeric = value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(numeric);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <img src="/albero.svg" alt="KYKOS" className="w-12 h-12" />
          <span className="text-3xl font-bold text-secondary-600">KYKOS</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifica il tuo email</h2>
        <p className="text-gray-600 mb-6">
          Abbiamo inviato un codice a <strong>{email}</strong>
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Input */}
          <div>
            <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700 mb-2">
              Codice di verifica
            </label>
            <input
              id="otpCode"
              type="text"
              value={otpCode}
              onChange={(e) => handleOtpChange(e.target.value)}
              placeholder="000000"
              className="w-full px-4 py-4 text-2xl tracking-widest text-center border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 outline-none transition"
              maxLength={6}
              autoFocus
            />
          </div>

          {/* Timer */}
          <div className="text-center">
            {timeLeft > 0 ? (
              <p className="text-sm text-gray-500">
                Il codice scade tra <span className="font-medium text-gray-700">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className="text-sm text-red-600">Codice scaduto</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            className="w-full py-3.5 bg-secondary-600 text-white font-semibold rounded-lg hover:bg-secondary-700 focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Verifica...</span>
              </>
            ) : (
              <>
                <span>✓</span>
                <span>Verifica codice</span>
              </>
            )}
          </button>
        </form>

        {/* Resend */}
        <div className="mt-6 text-center">
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-secondary-600 hover:text-secondary-700 font-medium"
            >
              Invia un nuovo codice
            </button>
          ) : (
            <p className="text-sm text-gray-500">
              Non hai ricevuto il codice?{' '}
              <button
                onClick={handleResend}
                disabled
                className="text-gray-400 cursor-not-allowed"
              >
                Richiedi nuovo codice
              </button>
              <span className="block mt-1 text-xs text-gray-400">
                (disponibile tra {formatTime(timeLeft)})
              </span>
            </p>
          )}
        </div>

        {/* Back to register */}
        <div className="mt-6 text-center">
          <Link href="/auth/register" className="text-sm text-gray-500 hover:text-secondary-600 transition">
            ← Torna alla registrazione
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding (same as register page) */}
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
              <h3 className="text-white font-semibold text-lg">Verifica email</h3>
              <p className="text-secondary-100 text-sm">Confermiamo che sei tu</p>
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

      {/* Right side - OTP form */}
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><p>Caricamento...</p></div>}>
        <VerifyOtpForm />
      </Suspense>
    </div>
  );
}