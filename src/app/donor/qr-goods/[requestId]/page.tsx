'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import QRCodeCard from '@/components/qr/QRCodeCard';

interface QRData {
  goodsRequest: {
    id: string;
    title: string;
    status: string;
  };
  qrCodes: {
    deliver: {
      type: 'deliver';
      data: string;
      imageUrl: string;
      label: string;
      description: string;
    };
    pickup: {
      type: 'pickup';
      data: string;
      imageUrl: string;
      label: string;
      description: string;
    };
  };
  userType: 'fulfiller' | 'beneficiary';
  entityName: string;
  entityHoursInfo: string | null;
  entityAddress: string | null;
  entityHouseNumber: string | null;
  entityCap: string | null;
  entityCity: string | null;
  entityProvince: string | null;
  entityPhone: string | null;
  entityEmail: string | null;
}

export default function GoodsRequestQRDPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = use(params);
  const [data, setData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHoursModal, setShowHoursModal] = useState(false);

  useEffect(() => {
    fetchQRData();
  }, [requestId]);

  const fetchQRData = async () => {
    try {
      const res = await fetch(`/api/entity-requests/${requestId}/qr`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        const err = await res.json();
        setError(err.error || 'Errore');
      }
    } catch (err) {
      setError('Errore di rete');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Dati non trovati'}</p>
          <Link href="/donor/dashboard" className="text-primary-600 hover:underline">
            ← Torna alla dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/donor/dashboard" className="text-sm text-gray-500 hover:text-primary-600 mb-2 inline-flex items-center gap-1">
            ← Torna alla dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">QR Code per la donazione</h1>
          <p className="text-gray-500">{data.goodsRequest.title}</p>
        </div>

        <div className="max-w-md mx-auto">
          <QRCodeCard
            type={data.qrCodes.deliver.type}
            data={data.qrCodes.deliver.data}
            imageUrl={data.qrCodes.deliver.imageUrl}
            label={data.qrCodes.deliver.label}
            description={data.qrCodes.deliver.description}
            objectTitle={data.goodsRequest.title}
          />

          {data.entityHoursInfo && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowHoursModal(true)}
                className="px-6 py-2.5 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 font-medium text-sm flex items-center gap-2"
              >
                <span>🕐</span> Orari Ente
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Hours Modal */}
      {showHoursModal && data && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span>🕐</span> Orari {data.entityName}
                </h3>
                <button
                  onClick={() => setShowHoursModal(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: data.entityHoursInfo || '' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
