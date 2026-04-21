import Link from 'next/link';

export default function ManifestoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary-600">KYKOS</Link>
            <nav className="flex items-center gap-6">
              <Link href="/auth/login" className="text-gray-600 hover:text-primary-600 font-medium">
                Accedi
              </Link>
              <Link href="/auth/register" className="text-gray-600 hover:text-primary-600 font-medium">
                Registrati
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Il Manifesto di KYKOS
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Dona con dignità, ricevi con gratitudine
          </p>
        </div>

        {/* Principles */}
        <div className="space-y-8 mb-16">
          <div className="bg-white p-8 rounded-2xl shadow-sm border">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🙏</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Anonimato e Rispetto
                </h2>
                <p className="text-gray-600 italic mb-3">
                  "...Non sappia la destra cosa fa la sinistra..."
                </p>
                <p className="text-gray-600">
                  Chi dona non sa a chi sta donando. Chi riceve non sa da chi ha ricevuto.
                  La dignità della persona è preservata attraverso l&apos;anonimato reciproco.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">💝</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  La Gioia del Donare
                </h2>
                <p className="text-gray-600 italic mb-3">
                  "...c&apos;è più gioia nel donare che nel ricevere..."
                </p>
                <p className="text-gray-600">
                  Il donatore sperimenta la gioia di fare del bene senza aspettarsi nulla in cambio.
                  Il ricevente riceve con gratitudine, senza debito di riconoscenza.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🌱</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Casa Comune e Riciclo
                </h2>
                <p className="text-gray-600">
                  Le cose inutilizzate da molti trovano nuova vita attraverso chi ne ha bisogno.
                  Preserviamo l&apos;ambiente e riduciamo gli sprechi, costruendo una comunità più sostenibile.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Come Funziona
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎁</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Offri</h3>
              <p className="text-sm text-gray-600">
                Dona beni che non usi più. Libri, vestiti, elettrodomestici, mobili...
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🙏</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Richiedi</h3>
              <p className="text-sm text-gray-600">
                Se autorizzato da un ente, richiedi ciò di cui hai bisogno con un contributo simbolico.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏢</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">L&apos;Ente Gestisce</h3>
              <p className="text-sm text-gray-600">
                Gli enti abilitati (Caritas, parrocchie, associazioni) mediano lo scambio e tutelano la privacy.
              </p>
            </div>
          </div>
        </div>

        {/* Policies */}
        <div className="bg-gray-50 p-8 rounded-2xl mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            I Nostri Principi
          </h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="text-green-500 mt-1">✓</span>
              <p className="text-gray-700">
                <strong>Accessibilità:</strong> La piattaforma è aperta a tutti, senza distinzione.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 mt-1">✓</span>
              <p className="text-gray-700">
                <strong>Geolocalizzazione:</strong> Lo scambio avviene sul territorio, vicino a te.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 mt-1">✓</span>
              <p className="text-gray-700">
                <strong>Autorizzazione:</strong> Gli enti certificano lo stato di bisogno per tutelare chi ne ha diritto.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 mt-1">✓</span>
              <p className="text-gray-700">
                <strong>Contributo simbolico:</strong> 1-2€ per preservare la dignità del ricevente.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 mt-1">✓</span>
              <p className="text-gray-700">
                <strong>Volontariato:</strong> Su base volontaria, i donatori possono offrire tempo e servizi.
              </p>
            </li>
          </ul>
        </div>

        {/* Actors */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Chi Partecipa
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon: '🏢', label: 'Enti Abilitati' },
              { icon: '📦', label: 'Centri di Scambio' },
              { icon: '🎁', label: 'Donatori' },
              { icon: '🙏', label: 'Riceventi' },
              { icon: '🤝', label: 'Volontari' },
              { icon: '⚙️', label: 'Amministratori' },
            ].map((actor) => (
              <div
                key={actor.label}
                className="bg-white px-6 py-3 rounded-full shadow-sm border flex items-center gap-2"
              >
                <span>{actor.icon}</span>
                <span className="font-medium text-gray-700">{actor.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Unisciti a KYKOS
          </h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Partecipa anche tu a questa rete di solidarietà, rispetto e sostenibilità.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
            >
              Registrati
            </Link>
            <Link
              href="/"
              className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Torna alla Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg font-bold text-white mb-2">KYKOS</p>
          <p className="text-sm">Dona con dignità, ricevi con gratitudine</p>
          <p className="text-xs mt-4">© 2024 KYKOS. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}
