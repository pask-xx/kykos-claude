import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function DonorToDeliverPage() {
  const session = await getSession();

  if (!session) {
    redirect('/auth/login');
  }

  if (session.role !== 'DONOR') {
    redirect(`/${session.role.toLowerCase()}/dashboard`);
  }

  // Fetch object donations (RESERVED status - object assigned to a request)
  const objectDonations = await prisma.donation.findMany({
    where: {
      donorId: session.id,
      object: { status: 'RESERVED' },
    },
    include: {
      object: {
        select: { id: true, title: true, imageUrls: true },
      },
      request: {
        select: { id: true },
      },
    },
  });

  // Fetch accepted goods offers (ACCEPTED status)
  const acceptedGoodsOffers = await prisma.goodsOffer.findMany({
    where: {
      offeredById: session.id,
      status: 'ACCEPTED',
    },
    include: {
      request: {
        select: { id: true, title: true, category: true },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Da consegnare</h1>
            <p className="text-gray-500 text-sm mt-1">
              {objectDonations.length + acceptedGoodsOffers.length} elementi da consegnare
            </p>
          </div>
          <Link
            href="/donor/dashboard"
            className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Empty state */}
        {objectDonations.length === 0 && acceptedGoodsOffers.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <span className="text-5xl mb-4 block">📦</span>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Niente da consegnare</h2>
            <p className="text-gray-500">Tutti i tuoi impegni sono stati evasi!</p>
          </div>
        )}

        {/* Object Donations */}
        {objectDonations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📦</span> Disponibilità
            </h2>
            <div className="space-y-3">
              {objectDonations.map((donation) => (
                <div key={donation.id} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border">
                  <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {donation.object.imageUrls && donation.object.imageUrls.length > 0 ? (
                      <img src={donation.object.imageUrls[0]} alt={donation.object.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{donation.object.title}</p>
                    <p className="text-xs text-blue-600">QR Code pronto</p>
                  </div>
                  <Link
                    href={`/donor/qr/${donation.object.id}`}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium flex-shrink-0"
                  >
                    📱 QR Code
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goods Requests */}
        {acceptedGoodsOffers.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>🎁</span> Richieste
            </h2>
            <div className="space-y-3">
              {acceptedGoodsOffers.map((offer) => (
                <div key={offer.id} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border">
                  <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    <span className="text-2xl">🎁</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{offer.request.title}</p>
                    <p className="text-xs text-gray-400">{offer.request.category}</p>
                  </div>
                  <Link
                    href={`/donor/qr-goods/${offer.request.id}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex-shrink-0"
                  >
                    📱 QR Code
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}