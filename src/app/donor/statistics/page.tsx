import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DONOR_LEVEL_LABELS } from '@/types';

export default async function DonorStatistics() {
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
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Statistiche</h1>
            <p className="text-gray-500 text-sm mt-1">La tua attività su KYKOS</p>
          </div>
          <Link
            href="/donor/dashboard"
            className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Richieste
          </Link>
        </div>

        {/* Personal Data Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>👤</span> Dati anagrafici
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
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
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🎁</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Oggetti donati</p>
                <p className="text-xl font-bold text-gray-900">{donatedObjects}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">💝</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Donazioni totali</p>
                <p className="text-xl font-bold text-gray-900">
                  €{totalDonations._sum.amount ? Number(totalDonations._sum.amount).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🏆</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Livello</p>
                <p className="text-xl font-bold text-amber-600">{levelLabel}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Deliveries */}
        {pendingDeliveries.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📦</span> Da consegnare
            </h2>
            <div className="space-y-3">
              {pendingDeliveries.map((donation) => (
                <div key={donation.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {donation.object.imageUrls && donation.object.imageUrls.length > 0 ? (
                      <img src={donation.object.imageUrls[0]} alt={donation.object.title} className="w-full h-full object-cover" />
                    ) : (
                      <span>📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{donation.object.title}</p>
                    <p className="text-xs text-blue-600">QR Code pronto</p>
                  </div>
                  <Link
                    href={`/donor/qr/${donation.requestId}`}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium flex-shrink-0"
                  >
                    QR
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attività recente</h2>
          {recentObjects.length === 0 ? (
            <p className="text-gray-500 text-center py-6 text-sm">
              Nessuna attività recente. Inizia donando un oggetto!
            </p>
          ) : (
            <div className="space-y-3">
              {recentObjects.map((obj) => (
                <div key={obj.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {obj.imageUrls && obj.imageUrls.length > 0 ? (
                      <img src={obj.imageUrls[0]} alt={obj.title} className="w-full h-full object-cover" />
                    ) : (
                      <span>📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{obj.title}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(obj.createdAt).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded flex-shrink-0 ${
                    obj.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                    obj.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-700' :
                    obj.status === 'DONATED' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {obj.status === 'AVAILABLE' ? 'Disp.' :
                     obj.status === 'RESERVED' ? 'Riserv.' :
                     obj.status === 'DONATED' ? 'Donato' : obj.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}