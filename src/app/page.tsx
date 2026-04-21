import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold text-primary-600">KYKOS</div>
          <div className="flex gap-4">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              Accedi
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Registrati
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Dona con dignità,
          <br />
          <span className="text-primary-600">ricevi con gratitudine</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          KYKOS连接需要帮助的人。不需要知道对方是谁，
          只需要知道你在改变生活。
          Anonimato totale per donatori e riceventi.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/register?role=donor"
            className="px-8 py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold text-lg"
          >
            Voglio donare
          </Link>
          <Link
            href="/auth/register?role=recipient"
            className="px-8 py-4 border-2 border-primary-600 text-primary-600 rounded-xl hover:bg-primary-50 font-semibold text-lg"
          >
            Ho bisogno di aiuto
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Anonimato totale</h3>
            <p className="text-gray-600">
              Chi dona non sa chi riceve. Chi riceve non sa chi dona.
              La dignità è preservata.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Intermediari fidati</h3>
            <p className="text-gray-600">
              Centri caritas, parrochie e associazioni verificano
              i riceventi e gestiscono lo scambio.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Incentivi morali</h3>
            <p className="text-gray-600">
              Livelli di donatore (Bronzo, Argento, Oro...)
              per ringraziare chi contribuisce.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Come funziona</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">1</div>
              <h4 className="font-semibold mb-2">Registrati</h4>
              <p className="text-gray-600 text-sm">Scegli se donare o ricevere</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">2</div>
              <h4 className="font-semibold mb-2">Pubblica o richiedi</h4>
              <p className="text-gray-600 text-sm">Oggetti da donare o bisogni</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">3</div>
              <h4 className="font-semibold mb-2">L&apos;intermediario gestisce</h4>
              <p className="text-gray-600 text-sm">Verifica e coordina</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">4</div>
              <h4 className="font-semibold mb-2">Scambio anonimo</h4>
              <p className="text-gray-600 text-sm">Un contributo simbolico (1-2€)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-500">
        <p>KYKOS - Dona con dignità, ricevi con gratitudine</p>
      </footer>
    </main>
  );
}
