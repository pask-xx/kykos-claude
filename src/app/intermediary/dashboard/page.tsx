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

  // Fetch stats in parallel
  const [pendingRequests, totalFunds, authorizedRecipients] = await Promise.all([
    prisma.request.count({
      where: { intermediaryId: org?.id, status: 'PENDING' },
    }),
    prisma.payment.aggregate({
      where: { intermediaryId: org?.id, status: 'COMPLETED' },
      _sum: { amount: true },
    }).then(res => res._sum.amount ? Number(res._sum.amount) : 0),
    prisma.user.count({
      where: { referenceEntityId: org?.id, authorized: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <p className="text-gray-600">{org?.name || 'Organizzazione'}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            org?.verified
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {org?.verified ? 'Verificato' : 'In verifica'}
          </span>
        </div>

        {/* Organization Data Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🏢</span> Dati organizzazione
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Nome</p>
              <p className="font-medium text-gray-900">{org?.name || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Tipo</p>
              <p className="font-medium text-gray-900">{org?.type || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Indirizzo</p>
              <p className="font-medium text-gray-900">{org?.address || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p className="font-medium text-gray-900">{org?.email || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Riceventi autorizzati</p>
              <p className="font-medium text-gray-900">{authorizedRecipients}</p>
            </div>
          </div>
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
                <p className="text-2xl font-bold text-gray-900">{pendingRequests}</p>
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
                <p className="text-2xl font-bold text-gray-900">€{totalFunds.toFixed(2)}</p>
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
              href="/intermediary/recipients"
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
