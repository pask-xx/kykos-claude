import Link from 'next/link';
import { Metadata } from 'next';
import SessionDashboardLink from '@/components/SessionDashboardLink';

export const metadata: Metadata = {
  title: 'Il Manifesto KYKOS - Donazione anonima e solidarietà',
  description: 'Scopri i principi fondanti di KYKOS: anonimato, gioia nel donare, sostenibilità. La donazione anonima che preserva la dignità di tutti.',
  keywords: ['manifesto KYKOS', 'donazione anonima', 'solidarietà', 'principi', 'Caritas', 'sostenibilità', 'economia circolare'],
  openGraph: {
    title: 'Il Manifesto KYKOS',
    description: 'Anonimato, gioia, sostenibilità. I principi che guidano la donazione anonima.',
    url: 'https://kykos.app/manifesto',
    type: 'website',
  },
};

export default function ManifestoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img src="/albero.svg" alt="KYKOS" className="w-10 h-10" />
              <span className="text-2xl font-bold text-primary-600">KYKOS</span>
            </Link>
            <nav className="flex items-center gap-4">
              <SessionDashboardLink />
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

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-primary-100 rounded-full mb-8 shadow-lg">
            <img src="/albero.svg" alt="KYKOS" className="w-16 h-16" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Il Manifesto di <span className="text-primary-600">KYKOS</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto italic">
            &ldquo;Dona con dignità, ricevi con gratitudine&rdquo;
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-gray-400">
            <span className="w-12 h-px bg-gray-300"></span>
            <span className="text-sm">I nostri principi fondanti</span>
            <span className="w-12 h-px bg-gray-300"></span>
          </div>
        </div>

        {/* Core Principles */}
        <div className="mb-16">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white p-8 rounded-2xl shadow-lg">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🙏</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Anonimato</h3>
              <p className="text-primary-100 text-sm leading-relaxed">
                Chi dona non sa a chi. Chi riceve non sa da chi. La dignità è preservata.
              </p>
            </div>
            <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white p-8 rounded-2xl shadow-lg">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">💝</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Gioia</h3>
              <p className="text-secondary-100 text-sm leading-relaxed">
                Più gioia nel donare che nel ricevere. Senza aspettative.
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-8 rounded-2xl shadow-lg">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🌱</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Sostenibilità</h3>
              <p className="text-green-100 text-sm leading-relaxed">
                Le cose trovano nuova vita. Riduciamo sprechi e impatto.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 mb-16">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">🙏</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Anonimato e Rispetto
                </h2>
                <p className="text-gray-600 italic mb-4 pl-4 border-l-4 border-primary-200">
                  &ldquo;...Non sappia la destra cosa fa la sinistra...&rdquo;
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Chi dona non sa a chi sta donando. Chi riceve non sa da chi ha ricevuto.
                  Questo principio fondamentale preserva la dignità di entrambi, eliminando
                  ogni forma di debito psicologico o sociale. Lo scambio avviene in modo
                  pulito, senza condizioni.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">💝</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  La Gioia del Donare
                </h2>
                <p className="text-gray-600 italic mb-4 pl-4 border-l-4 border-secondary-200">
                  &ldquo;...c&apos;è più gioia nel donare che nel ricevere...&rdquo;
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Il donatore sperimenta la gioia autentica di fare del bene senza aspettarsi
                  nulla in cambio. Il ricevente riceve con gratitudine genuina, senza debito
                  di riconoscenza. È un ciclo virtuoso di generosità che arricchisce entrambi.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">🌍</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Casa Comune e Riciclo
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Le cose inutilizzate da molti trovano nuova vita attraverso chi ne ha
                  realmente bisogno. Preserviamo l&apos;ambiente e riduciamo gli sprechi,
                  costruendo una comunità più sostenibile e solidale. Ogni oggetto ha valore
                  se trova chi ne ha bisogno.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Come Funziona
          </h2>
          <p className="text-gray-600 text-center mb-10 max-w-xl mx-auto">
            Un processo semplice che mette in contatto chi ha bisogno con chi può donare
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center h-full">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🎁</span>
                </div>
                <span className="inline-block bg-primary-600 text-white text-sm font-bold px-3 py-1 rounded-full mb-4">Passo 1</span>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Offri</h3>
                <p className="text-gray-600">
                  Dona beni che non usi più. Libri, vestiti, elettrodomestici, mobili...
                  Ogni oggetto può fare la differenza.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <span className="text-3xl text-gray-300">→</span>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center h-full">
                <span className="inline-block bg-secondary-600 text-white text-sm font-bold px-3 py-1 rounded-full mb-4">Passo 2</span>
                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">📝</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Richiedi</h3>
                <p className="text-gray-600">
                  Se autorizzato da un ente, richiedi ciò di cui hai bisogno con un
                  contributo simbolico di 1-2 euro.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <span className="text-3xl text-gray-300">→</span>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center h-full">
              <span className="inline-block bg-amber-500 text-white text-sm font-bold px-3 py-1 rounded-full mb-4">Passo 3</span>
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🏢</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">L&apos;Ente Gestisce</h3>
              <p className="text-gray-600">
                Gli enti abilitati (Caritas, parrocchie, associazioni) mediano lo
                scambio e tutelano la privacy di tutti.
              </p>
            </div>
          </div>
        </div>

        {/* Our Principles */}
        <div className="bg-gradient-to-br from-gray-50 to-white p-10 rounded-3xl mb-16 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center flex items-center justify-center gap-3">
            <span className="w-10 h-px bg-gray-300"></span>
            I Nostri Principi
            <span className="w-10 h-px bg-gray-300"></span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-50">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Accessibilità</h3>
                <p className="text-sm text-gray-600">
                  La piattaforma è aperta a tutti, senza distinzione di alcun tipo.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-50">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Territorio</h3>
                <p className="text-sm text-gray-600">
                  Lo scambio avviene sul territorio, vicino a te, rafforzando la comunità locale.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-50">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Autorizzazione</h3>
                <p className="text-sm text-gray-600">
                  Gli enti certificano lo stato di bisogno per tutelare chi ne ha diritto.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-50">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Contributo Simbolico</h3>
                <p className="text-sm text-gray-600">
                  1-2€ per preservare la dignità del ricevente, senza barriere economiche.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-50">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Volontariato</h3>
                <p className="text-sm text-gray-600">
                  Su base volontaria, i donatori possono offrire tempo e servizi.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-50">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Trasparenza</h3>
                <p className="text-sm text-gray-600">
                  Tutti gli scambi sono tracciati e verificabili dagli enti autorizzati.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="mb-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Chi Partecipa
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon: '🏢', label: 'Enti Abilitati', color: 'bg-amber-100 text-amber-700' },
              { icon: '📦', label: 'Centri di Scambio', color: 'bg-primary-100 text-primary-700' },
              { icon: '🎁', label: 'Donatori', color: 'bg-green-100 text-green-700' },
              { icon: '🙏', label: 'Riceventi', color: 'bg-secondary-100 text-secondary-700' },
              { icon: '🤝', label: 'Volontari', color: 'bg-blue-100 text-blue-700' },
              { icon: '⚙️', label: 'Amministratori', color: 'bg-gray-100 text-gray-700' },
            ].map((actor) => (
              <div
                key={actor.label}
                className={`${actor.color} px-5 py-3 rounded-full shadow-sm flex items-center gap-2 font-medium`}
              >
                <span className="text-xl">{actor.icon}</span>
                <span>{actor.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-3xl p-12 shadow-xl">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
            <img src="/albero.svg" alt="KYKOS" className="w-14 h-14" />
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Unisciti a KYKOS
          </h2>
          <p className="text-primary-100 mb-8 max-w-lg mx-auto text-lg">
            Partecipa anche tu a questa rete di solidarietà, rispetto e sostenibilità.
            Insieme possiamo fare la differenza.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition shadow-md"
            >
              Registrati ora
            </Link>
            <Link
              href="/"
              className="px-8 py-4 border-2 border-white/50 text-white font-semibold rounded-lg hover:bg-white/10 transition"
            >
              Torna alla Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/albero.svg" alt="KYKOS" className="w-8 h-8" />
            <span className="text-xl font-bold text-white">KYKOS</span>
          </div>
          <p className="text-sm italic mb-2">Dona con dignità, ricevi con gratitudine</p>
          <p className="text-xs mt-4 text-gray-500">© 2024 KYKOS. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}
