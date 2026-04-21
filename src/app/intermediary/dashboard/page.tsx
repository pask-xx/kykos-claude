import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function IntermediaryDashboard() {
  const session = await getSession();

  if (!session) {
    redirect('/auth/login');
  }

  if (session.role !== 'INTERMEDIARY') {
    redirect(`/${session.role.toLowerCase()}/dashboard`);
  }

  // Get organization data
  const org = await prisma.organization.findUnique({
    where: { userId: session.id },
    include: {
      _count: {
        select: {
          objects: true,
          requests: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary-600">KYKOS</Link>
            <nav className="flex items-center gap-6">
              <Link href="/intermediary/dashboard" className="text-gray-600 hover:text-primary-600 font-medium">
                Dashboard
              </Link>
              <Link href="/intermediary/requests" className="text-gray-600 hover:text-primary-600 font-medium">
                Richieste
              </Link>
              <Link href="/intermediary/recipients" className="text-gray-600 hover:text-primary-600 font-medium">
                Riceventi
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{session.name}</span>
                <form action="/api/auth/logout" method="POST">
                  <button type="submit" className="text-sm text-red-600 hover:text-red-700">
                    Esci
                  </button>
                </form>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Intermediario</h1>
            <p className="text-gray-600 mt-1">{org?.name || 'Organizzazione'}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            org?.verified
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {org?.verified ? 'Verificato' : 'In verifica'}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Oggetti</p>
                <p className="text-2xl font-bold text-gray-900">{org?._count.objects || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Riceventi</p>
                <p className="text-2xl font-bold text-gray-900">{org?._count.requests || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">In attesa</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fondi raccolti</p>
                <p className="text-2xl font-bold text-gray-900">€0.00</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Azioni rapide</h2>
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/intermediary/requests"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Gestisci richieste
            </Link>
            <Link
              href="/intermediary/recipients/new"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Autorizza ricevente
            </Link>
            <Link
              href="/intermediary/objects"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Gestisci oggetti
            </Link>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Richieste recenti</h2>
            <Link
              href="/intermediary/requests"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Vedi tutte →
            </Link>
          </div>
          <p className="text-gray-500 text-center py-8">
            Nessuna richiesta da gestire
          </p>
        </div>
      </main>
    </div>
  );
}
