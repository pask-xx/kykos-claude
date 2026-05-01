'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function AdesioneConfirmContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'already_confirmed'>('idle');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token');

  const handleConfirm = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/adesione/confirm?token=${token}`);
      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Email confermata con successo!');
      } else if (data.error === 'Email già confermata') {
        setStatus('already_confirmed');
        setMessage(data.error);
      } else {
        setStatus('error');
        setMessage(data.error || 'Errore durante la conferma');
      }
    } catch {
      setStatus('error');
      setMessage('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
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
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">❌</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Link non valido</h1>
            <p className="text-xl text-gray-600 mb-8">
              Il link di conferma non è valido o è incompleto.
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Torna alla home
            </Link>
          </div>
        </main>
      </div>
    );
  }

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
          {status === 'idle' && (
            <>
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📧</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Conferma la tua email</h1>
              <p className="text-xl text-gray-600 mb-4">
                Clicca sul pulsante qui sotto per confermare il tuo indirizzo email e completare la richiesta di adesione.
              </p>
              <p className="text-gray-500 mb-8">
                Dopo la conferma, il nostro team valuterà la tua candidatura e ti contatterà.
              </p>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-lg disabled:opacity-50 transition"
              >
                {loading ? 'Conferma in corso...' : 'Conferma email'}
              </button>
            </>
          )}

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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Caricamento...</h1>
          <p className="text-gray-600">Verifica del link di conferma.</p>
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