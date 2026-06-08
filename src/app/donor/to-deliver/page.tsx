import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Gift, Package, QrCode } from 'lucide-react';
import { Button } from '@/components/ui';
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

  // Fetch object donations (RESERVED status - object assigned to a request, not yet donated)
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

  // Fetch accepted goods offers (ACCEPTED status) where request is not yet fulfilled/delivered
  const acceptedGoodsOffers = await prisma.goodsOffer.findMany({
    where: {
      offeredById: session.id,
      status: 'ACCEPTED',
      request: {
        status: { notIn: ['FULFILLED', 'DELIVERED', 'COMPLETED'] },
      },
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
          <Link href="/donor/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
              Dashboard
            </Button>
          </Link>
        </div>

        {/* Empty state */}
        {objectDonations.length === 0 && acceptedGoodsOffers.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Niente da consegnare</h2>
            <p className="text-gray-500">Tutti i tuoi impegni sono stati evasi!</p>
          </div>
        )}

        {/* Object Donations */}
        {objectDonations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-600" aria-hidden="true" />
              Disponibilità
            </h2>
            <div className="space-y-3">
              {objectDonations.map((donation) => (
                <div key={donation.id} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border">
                  <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {donation.object.imageUrls && donation.object.imageUrls.length > 0 ? (
                      <img src={donation.object.imageUrls[0]} alt={donation.object.title} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-7 w-7 text-gray-500" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{donation.object.title}</p>
                    <p className="text-xs text-info-600">QR Code pronto</p>
                  </div>
                  <Link href={`/donor/qr/${donation.request.id}`}>
                    <Button variant="primary" size="sm">
                      <QrCode className="h-4 w-4 mr-1" aria-hidden="true" />
                      QR Code
                    </Button>
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
              <Gift className="h-5 w-5 text-gray-600" aria-hidden="true" />
              Richieste
            </h2>
            <div className="space-y-3">
              {acceptedGoodsOffers.map((offer) => (
                <div key={offer.id} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border">
                  <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    <Gift className="h-7 w-7 text-gray-500" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{offer.request.title}</p>
                    <p className="text-xs text-gray-400">{offer.request.category}</p>
                  </div>
                  <Link href={`/donor/qr-goods/${offer.request.id}`}>
                    <Button variant="success" size="sm">
                      <QrCode className="h-4 w-4 mr-1" aria-hidden="true" />
                      QR Code
                    </Button>
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