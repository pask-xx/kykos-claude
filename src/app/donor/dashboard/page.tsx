import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DONOR_LEVEL_LABELS } from '@/types';

export default async function DonorDashboard() {
  const session = await getSession();

  if (!session) {
    redirect('/auth/login');
  }

  if (session.role !== 'DONOR') {
    redirect(`/${session.role.toLowerCase()}/dashboard`);
  }

  // Parallel queries for better performance
  const [user, donatedObjects, totalDonations, recentObjects, pendingDeliveries] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        fiscalCode: true,
        address: true,
        houseNumber: true,
        cap: true,
        city: true,
        createdAt: true,
        donorProfile: true,
      },
    }),
    prisma.object.count({
      where: { donorId: session.id },
    }),
    prisma.donation.aggregate({
      where: { donorId: session.id },
      _sum: { amount: true },
    }),
    prisma.object.findMany({
      where: { donorId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.donation.findMany({
      where: {
        donorId: session.id,
        object: { status: 'RESERVED' },
      },
      include: {
        object: {
          select: { id: true, title: true, imageUrls: true },
        },
      },
    }),
  ]);

  const level = user?.donorProfile?.level || 'BRONZE';
  const levelLabel = DONOR_LEVEL_LABELS[level] || 'Bronzo';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
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
              <p className="text-sm text-gray-500 mb-1">Membro dal</p>
              <p className="font-medium text-gray-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎁</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Oggetti donati</p>
                <p className="text-2xl font-bold text-gray-900">{donatedObjects}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💝</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Donazioni totali</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{totalDonations._sum.amount ? Number(totalDonations._sum.amount).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Livello attuale</p>
                <p className="text-2xl font-bold text-amber-600">{levelLabel}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Deliveries */}
        {pendingDeliveries.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📦</span> Da consegnare
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Questi oggetti sono stati richiesti. Recati all&apos;ente con l&apos;oggetto per completare la consegna.
            </p>
            <div className="space-y-4">
              {pendingDeliveries.map((donation) => (
                <div key={donation.id} className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {donation.object.imageUrls && donation.object.imageUrls.length > 0 ? (
                      <img src={donation.object.imageUrls[0]} alt={donation.object.title} className="w-full h-full object-cover" />
                    ) : (
                      <span>📦</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{donation.object.title}</p>
                    <p className="text-sm text-blue-600">QR Code pronto per la consegna</p>
                  </div>
                  <Link
                    href={`/donor/qr/${donation.requestId}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    Mostra QR
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Azioni rapide</h2>
          <div className="flex gap-4">
            <Link
              href="/donor/objects/new"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              + Nuovo oggetto
            </Link>
            <Link
              href="/objects"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Sfoglia oggetti
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Attività recente</h2>
          {recentObjects.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nessuna attività recente. Inizia donando un oggetto!
            </p>
          ) : (
            <div className="space-y-4">
              {recentObjects.map((obj) => (
                <div key={obj.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {obj.imageUrls && obj.imageUrls.length > 0 ? (
                      <img src={obj.imageUrls[0]} alt={obj.title} className="w-full h-full object-cover" />
                    ) : (
                      <span>📦</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{obj.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(obj.createdAt).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    obj.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                    obj.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-700' :
                    obj.status === 'DONATED' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {obj.status === 'AVAILABLE' ? 'Disponibile' :
                     obj.status === 'RESERVED' ? 'Riservato' :
                     obj.status === 'DONATED' ? 'Donato' : 'Ritirato'}
                  </span>
                </div>
              ))}
            </div>
          )}
          {recentObjects.length > 0 && (
            <div className="mt-4 text-center">
              <Link
                href="/donor/objects"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Vedi tutti gli oggetti →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
