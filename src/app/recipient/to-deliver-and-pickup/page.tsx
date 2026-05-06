import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function RecipientToDeliverAndPickupPage() {
  const session = await getSession();

  if (!session) {
    redirect('/auth/login');
  }

  if (session.role !== 'RECIPIENT') {
    redirect(`/${session.role.toLowerCase()}/dashboard`);
  }

  // Consegne: oggetti che il recipient ha donato (status RESERVED)
  const donations = await prisma.donation.findMany({
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

  // Ritiri Oggetti: requests dove recipientId = session.id E object.status = 'DEPOSITED'
  const objectRequests = await prisma.request.findMany({
    where: {
      recipientId: session.id,
      object: { status: 'DEPOSITED' },
    },
    include: {
      object: {
        select: { id: true, title: true, imageUrls: true },
      },
    },
  });

  // Ritiri Beni/Servizi: goodsRequests dove beneficiaryId = session.id E status = 'DELIVERED'
  const goodsRequestsDelivered = await prisma.goodsRequest.findMany({
    where: {
      beneficiaryId: session.id,
      status: 'DELIVERED',
    },
    select: {
      id: true,
      title: true,
      category: true,
    },
  });

  const totalItems = donations.length + objectRequests.length + goodsRequestsDelivered.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Consegne e Ritiri</h1>
            <p className="text-gray-500 text-sm mt-1">
              {totalItems} elementi da gestire
            </p>
          </div>
          <Link
            href="/recipient/dashboard"
            className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Empty state */}
        {totalItems === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <span className="text-5xl mb-4 block">🎉</span>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Niente da gestire</h2>
            <p className="text-gray-500">Tutti i tuoi impegni sono stati evasi!</p>
          </div>
        )}

        {/* Consegne */}
        {donations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📦</span> Consegne
            </h2>
            <div className="space-y-3">
              {donations.map((donation) => (
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
                    href={`/recipient/qr/${donation.requestId}`}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium flex-shrink-0"
                  >
                    📱 QR Code
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ritiri Oggetti */}
        {objectRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📦</span> Ritiri - Oggetti
            </h2>
            <div className="space-y-3">
              {objectRequests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border">
                  <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {req.object.imageUrls && req.object.imageUrls.length > 0 ? (
                      <img src={req.object.imageUrls[0]} alt={req.object.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{req.object.title}</p>
                    <p className="text-xs text-green-600">Pronto per il ritiro</p>
                  </div>
                  <Link
                    href={`/recipient/qr/${req.id}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex-shrink-0"
                  >
                    📱 QR Ritiro
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ritiri Beni/Servizi */}
        {goodsRequestsDelivered.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>🎁</span> Ritiri - Beni e Servizi
            </h2>
            <div className="space-y-3">
              {goodsRequestsDelivered.map((gr) => (
                <div key={gr.id} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border">
                  <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    <span className="text-2xl">🎁</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{gr.title}</p>
                    <p className="text-xs text-gray-400">{gr.category}</p>
                  </div>
                  <Link
                    href={`/recipient/qr-goods/${gr.id}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex-shrink-0"
                  >
                    📱 QR Ritiro
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