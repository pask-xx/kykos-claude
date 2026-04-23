import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function RecipientDashboard() {
  const session = await getSession();

  // Parallel queries for better performance
  const [user, pendingRequests, receivedDonations, totalContributions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session!.id },
      include: {
        referenceEntity: true,
      },
    }),
    prisma.request.count({
      where: { recipientId: session!.id, status: 'PENDING' },
    }),
    prisma.donation.count({
      where: { recipientId: session!.id },
    }),
    prisma.donation.aggregate({
      where: { recipientId: session!.id },
      _sum: { amount: true },
    }),
  ]);

  const authorizationStatus = user?.authorized ? 'Autorizzato' : 'In attesa di autorizzazione';
  const statusColor = user?.authorized ? 'text-green-600' : 'text-yellow-600';

  return (
    <div className="max-w-6xl p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Ricevente</h1>

        {/* Status Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              user?.authorized ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              <span className="text-2xl">{user?.authorized ? '✅' : '⏳'}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Stato autorizzazione</p>
              <p className={`text-sm ${statusColor}`}>{authorizationStatus}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Richieste pendenti</p>
                <p className="text-2xl font-bold text-gray-900">{pendingRequests}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎁</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Oggetti ricevuti</p>
                <p className="text-2xl font-bold text-gray-900">{receivedDonations}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contributi versati</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{totalContributions._sum.amount ? Number(totalContributions._sum.amount).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Data Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>👤</span> Dati anagrafici
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Nome completo</p>
              <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Codice Fiscale</p>
              <p className="font-medium text-gray-900 uppercase">{user?.fiscalCode || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Data di nascita</p>
              <p className="font-medium text-gray-900">
                {user?.birthDate ? new Date(user.birthDate).toLocaleDateString('it-IT') : '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Indirizzo</p>
              <p className="font-medium text-gray-900">
                {user?.address ? `${user.address}, ${user.houseNumber || ''}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">CAP / Città</p>
              <p className="font-medium text-gray-900">
                {user?.cap ? `${user.cap} ${user.city || ''}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Valore ISEE</p>
              <p className="font-medium text-gray-900">
                {user?.isee ? `€${Number(user.isee).toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Ente di riferimento</p>
              <p className="font-medium text-gray-900">{user?.referenceEntity?.name || '—'}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Azioni rapide</h2>
          <div className="flex gap-4">
            <Link
              href="/recipient/objects"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Sfoglia oggetti
            </Link>
            <Link
              href="/recipient/requests"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Le mie richieste
            </Link>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Come funziona</h2>
          <div className="space-y-4 text-gray-600">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary-600">1</span>
              </div>
              <p>Sfoglia gli oggetti disponibili nella sezione "Sfoglia"</p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary-600">2</span>
              </div>
              <p>Invia una richiesta per l&apos;oggetto che ti interessa</p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary-600">3</span>
              </div>
              <p>L&apos;intermediario verificherà la tua richiesta</p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary-600">4</span>
              </div>
              <p>Se approvato, versa un contributo simbolico (1-2€) e ritira l&apos;oggetto</p>
            </div>
          </div>
        </div>
      </div>
  );
}
