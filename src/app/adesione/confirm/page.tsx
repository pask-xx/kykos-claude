'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function AdesioneConfirmContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_confirmed'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Token di conferma mancante');
      return;
    }

    // Call the confirmation API
    fetch(`/api/adesione/confirm?token=${token}`)
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email confermata con successo!');
        } else {
          setStatus(data.error === 'Email già confermata' ? 'already_confirmed' : 'error');
          setMessage(data.error || 'Errore durante la conferma');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Errore di connessione');
      });
  }, [searchParams]);

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

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {status === 'loading' && (
            <>
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">⏳</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Conferma in corso...</h1>
              <p className="text-gray-600">Stiamo verificando il tuo indirizzo email.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✅</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Email confermata!</h1>
              <p className="text-xl text-gray-600 mb-8">
                {message}
              </p>
              <p className="text-gray-600 mb-8">
                Il nostro team valuterà la tua candidatura e ti contatterà presto all'indirizzo email fornito.
              </p>
              <Link
                href="/"
                className="inline-block px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Torna alla home
              </Link>
            </>
          )}

          {status === 'already_confirmed' && (
            <>
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">ℹ️</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Email già confermata</h1>
              <p className="text-xl text-gray-600 mb-8">
                Questa email è già stata confermata in precedenza.
              </p>
              <Link
                href="/"
                className="inline-block px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Torna alla home
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">❌</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Conferma fallita</h1>
              <p className="text-xl text-gray-600 mb-8">
                {message}
              </p>
              <p className="text-gray-600 mb-8">
                Il link di conferma potrebbe essere scaduto o non essere valido. Prova a contattare il supporto.
              </p>
              <Link
                href="/"
                className="inline-block px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Torna alla home
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/albero.svg" alt="KYKOS" className="w-10 h-10" />
            <span className="text-2xl font-bold text-primary-600">KYKOS</span>
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⏳</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Conferma in corso...</h1>
          <p className="text-gray-600">Stiamo verificando il tuo indirizzo email.</p>
        </div>
      </main>
    </div>
  );
}

export default function AdesioneConfirmPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdesioneConfirmContent />
    </Suspense>
  );
}