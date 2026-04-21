import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ORG_TYPE_LABELS } from '@/types';

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session) {
    redirect('/auth/login');
  }

  if (session.role !== 'ADMIN') {
    redirect('/');
  }

  // Fetch intermediaries with pending verification
  const intermediaries = await prisma.organization.findMany({
    include: {
      user: {
        select: { email: true, createdAt: true },
      },
      _count: {
        select: {
          objects: true,
          requests: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const verifiedCount = intermediaries.filter(i => i.verified).length;
  const pendingCount = intermediaries.filter(i => !i.verified).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary-600">KYKOS</Link>
            <nav className="flex items-center gap-6">
              <Link href="/admin/dashboard" className="text-gray-600 hover:text-primary-600 font-medium">
                Admin
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Ciao, {session.name}</span>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Pannello Amministratore</h1>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Enti verificati</p>
                <p className="text-2xl font-bold text-gray-900">{verifiedCount}</p>
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
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏢</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Totale enti</p>
                <p className="text-2xl font-bold text-gray-900">{intermediaries.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Intermediaries List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Gestione Enti</h2>

          {intermediaries.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nessun ente registrato</p>
          ) : (
            <div className="space-y-4">
              {intermediaries.map((org) => (
                <div key={org.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{org.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded ${
                        org.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {org.verified ? 'Verificato' : 'In attesa'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {ORG_TYPE_LABELS[org.type]} • {org.user.email}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Registrato il {new Date(org.user.createdAt).toLocaleDateString('it-IT')}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>📦 {org._count.objects} oggetti</span>
                      <span>📋 {org._count.requests} richieste</span>
                    </div>
                  </div>
                  {!org.verified && (
                    <form action={`/api/admin/intermediaries/${org.id}/verify`} method="POST">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                      >
                        Approva
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
