'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface DocumentState {
  current: string;
  accepted: string | null;
  outdated: boolean;
  url: string;
}

interface StatusResponse {
  documents: {
    TERMS: DocumentState;
    PRIVACY: DocumentState;
  };
  requiresReconsent: boolean;
}

function CheckLegalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/legal/status');
        if (cancelled) return;
        if (res.status === 401) {
          // Sessione persa: rimando al login
          router.push('/auth/login');
          return;
        }
        if (!res.ok) {
          setError('Impossibile verificare lo stato dei consensi');
          return;
        }
        const data = (await res.json()) as StatusResponse;
        if (cancelled) return;
        setStatus(data);
        // Se nessun documento è outdated, l'utente è qui per errore →
        // rimandiamo al next.
        if (!data.requiresReconsent) {
          router.push(next);
        }
      } catch {
        setError('Errore di connessione');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [next, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!acceptTerms || !acceptPrivacy) {
      setError('Devi accettare entrambi i documenti aggiornati per continuare');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/legal/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: 'TERMS' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Errore nel salvataggio del consenso');
        return;
      }
      const res2 = await fetch('/api/legal/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: 'PRIVACY' }),
      });
      if (!res2.ok) {
        const data = await res2.json().catch(() => ({}));
        setError(data.error || 'Errore nel salvataggio del consenso');
        return;
      }
      // OK, l'utente può continuare dove stava andando
      router.push(next);
    } catch {
      setError('Errore di connessione');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Caricamento...</p>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/auth/login" className="text-secondary-600 underline">
            Torna al login
          </Link>
        </div>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Documenti legali aggiornati
          </h1>
          <p className="text-gray-600">
            Per continuare a usare KYKOS, ti chiediamo di prendere visione
            delle versioni aggiornate dei nostri documenti legali.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Terms of use */}
          {status.documents.TERMS.outdated && (
            <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-800 mb-3">
                <strong>Condizioni d&apos;uso</strong> — versione corrente: v{status.documents.TERMS.current}
                {status.documents.TERMS.accepted && (
                  <span className="block mt-1 text-xs text-amber-700">
                    Avevi accettato la v{status.documents.TERMS.accepted}.
                  </span>
                )}
              </p>
              <a
                href={status.documents.TERMS.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-secondary-600 hover:text-secondary-700 underline font-medium mb-3"
              >
                Apri il PDF (v{status.documents.TERMS.current}) in nuova tab ↗
              </a>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  required
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-secondary-600 focus:ring-secondary-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  Ho letto e accetto le Condizioni d&apos;uso v{status.documents.TERMS.current}.
                </span>
              </label>
            </div>
          )}

          {/* Privacy */}
          {status.documents.PRIVACY.outdated && (
            <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-800 mb-3">
                <strong>Informativa Privacy</strong> — versione corrente: v{status.documents.PRIVACY.current}
                {status.documents.PRIVACY.accepted && (
                  <span className="block mt-1 text-xs text-amber-700">
                    Avevi accettato la v{status.documents.PRIVACY.accepted}.
                  </span>
                )}
              </p>
              <a
                href={status.documents.PRIVACY.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-secondary-600 hover:text-secondary-700 underline font-medium mb-3"
              >
                Apri il PDF (v{status.documents.PRIVACY.current}) in nuova tab ↗
              </a>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptPrivacy}
                  onChange={(e) => setAcceptPrivacy(e.target.checked)}
                  required
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-secondary-600 focus:ring-secondary-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  Ho letto e accetto l&apos;Informativa Privacy v{status.documents.PRIVACY.current}
                  {' '}ai sensi dell&apos;art. 13 GDPR.
                </span>
              </label>
            </div>
          )}

          <p className="text-xs text-gray-500">
            I consensi verranno registrati con timestamp, indirizzo IP e
            User-Agent ai sensi del Provvedimento del Garante Privacy n. 229/2014.
          </p>

          <button
            type="submit"
            disabled={submitting || !acceptTerms || !acceptPrivacy}
            className="w-full py-3.5 bg-secondary-600 text-white font-semibold rounded-lg hover:bg-secondary-700 focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Salvataggio...</span>
              </>
            ) : (
              <>
                <span>✅</span>
                <span>Conferma e continua</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
              router.push('/');
            }}
            className="text-sm text-gray-500 hover:text-secondary-600 underline"
          >
            Esci (logout)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckLegalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><p>Caricamento...</p></div>}>
      <CheckLegalContent />
    </Suspense>
  );
}
