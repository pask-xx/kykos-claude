import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CATEGORY_LABELS } from '@/types';

interface UnifiedItem {
  id: string;
  title: string;
  category: string;
  imageUrls: string[] | null;
  itemType: 'DONATION' | 'OBJECT' | 'GOODS';
  link: string;
  label: string;
}

const TYPE_COLORS: Record<string, { border: string; badge: string }> = {
  DONATION: { border: 'border-l-blue-500', badge: 'bg-blue-100 text-blue-700' },
  OBJECT: { border: 'border-l-green-500', badge: 'bg-green-100 text-green-700' },
  GOODS: { border: 'border-l-purple-500', badge: 'bg-purple-100 text-purple-700' },
};

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

  const unified: UnifiedItem[] = [
    ...donations.map(d => ({
      id: d.id,
      title: d.object.title,
      category: 'OBJECT',
      imageUrls: d.object.imageUrls,
      itemType: 'DONATION' as const,
      link: `/recipient/qr/${d.requestId}`,
      label: 'Consegna',
    })),
    ...objectRequests.map(r => ({
      id: r.id,
      title: r.object.title,
      category: 'OBJECT',
      imageUrls: r.object.imageUrls,
      itemType: 'OBJECT' as const,
      link: `/recipient/qr/${r.id}`,
      label: 'Ritiro Oggetto',
    })),
    ...goodsRequestsDelivered.map(gr => ({
      id: gr.id,
      title: gr.title,
      category: gr.category,
      imageUrls: null,
      itemType: 'GOODS' as const,
      link: `/recipient/qr-goods/${gr.id}`,
      label: 'Ritiro Bene/Servizio',
    })),
  ];

  const totalItems = unified.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Da gestire</h1>
            <p className="text-gray-500 text-sm mt-1">
              {totalItems} elementi
            </p>
          </div>
          <Link
            href="/recipient/dashboard"
            className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-sm mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-gray-600">Consegne</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-600">Ritiri Oggetti</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            <span className="text-gray-600">Ritiri Beni/Servizi</span>
          </div>
        </div>

        {/* Empty state */}
        {totalItems === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <span className="text-5xl mb-4 block">🎉</span>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Niente da gestire</h2>
            <p className="text-gray-500">Tutti i tuoi impegni sono stati evasi!</p>
          </div>
        )}

        {/* Unified list */}
        {totalItems > 0 && (
          <div className="grid gap-3">
            {unified.map((item) => {
              const colors = TYPE_COLORS[item.itemType];
              return (
                <Link
                  key={`${item.itemType}-${item.id}`}
                  href={item.link}
                  className={`flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-primary-300 transition border-l-4 ${colors.border}`}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                      <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">
                        {item.itemType === 'GOODS' ? '🎁' : '📦'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate text-sm">{item.title}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${colors.badge}`}>
                        {item.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.itemType === 'GOODS'
                        ? CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] || item.category
                        : item.itemType === 'DONATION' ? 'QR Code pronto' : 'Pronto per il ritiro'}
                    </p>
                  </div>
                  <svg className="w-6 h-6 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}