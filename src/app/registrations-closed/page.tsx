'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegistrationsClosedPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/notify-when-open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Errore durante l\'invio');
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="max-w-2xl mx-auto">
          {/* Icon */}
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🚧</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Costruiamo insieme la rete KYKOS
          </h1>

          <p className="text-lg text-gray-600 text-center mb-8">
            Al momento le registrazioni sono chiuse perché stiamo costruendo
            la <strong>rete di intermediari</strong> (parrocchie, centri Caritas,
            associazioni) che permetteranno a KYKOS di funzionare.
          </p>

          <div className="bg-white rounded-2xl shadow-sm border p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Come funzionerà KYKOS
            </h2>
            <p className="text-gray-600 mb-6">
              KYKOS connette chi vuole donare oggetti con chi ne ha bisogno,
              attraverso una rete di <strong>enti fidati</strong> che verificano
              i beneficiari e gestiscono lo scambio in sicurezza e anonimato.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>🎁</span>
              <span>Donatore pubblica oggetti</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
              <span>🏢</span>
              <span>Ente verifica e coordina</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
              <span>🙏</span>
              <span>Beneficiario richiede</span>
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-8 mb-8">
            <h2 className="text-xl font-semibold text-amber-900 mb-4">
              Conosci un ente che potrebbe essere interessato?
            </h2>
            <p className="text-amber-800 mb-4">
              Se conosci <strong>parrocchie, centri Caritas, associazioni</strong> o
              altri enti del territorio, parlane loro di KYKOS! Più enti conosceranno
              il progetto, prima potremo attivare le registrazioni.
            </p>
            <p className="text-amber-700 text-sm">
              Condividi il sito <strong>kykos.it</strong> con chi potrebbe essere
              interessato a entrare nella rete KYKOS.
            </p>
          </div>

          {/* Notify me section */}
          <div className="bg-white rounded-2xl shadow-sm border p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Vuoi essere avvisato quando apriamo?
            </h2>
            <p className="text-gray-600 mb-6">
              Lascia la tua email e ti avviseremo appena le registrazioni saranno di nuovo aperte.
            </p>

            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <span className="text-3xl mb-2 block">✅</span>
                <p className="text-green-700 font-medium">
                  Email registrata! Ti avviseremo appena le registrazioni aprono.
                </p>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="space-y-4">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder=" tua@email.com"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Invio...' : 'Avvisami'}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Non spammeremo. Ti invieremo solo una notifica quando KYKOS sarà pronto.
                </p>
              </form>
            )}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-gray-500 hover:text-primary-600 transition"
            >
              ← Torna alla home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/albero.svg" alt="KYKOS" className="w-8 h-8" />
            <span className="text-xl font-bold text-white">KYKOS</span>
          </div>
          <p className="text-sm">Dona con amore, ricevi con dignità</p>
          <p className="text-xs mt-4 text-gray-500">© 2024-2026 KYKOS. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}