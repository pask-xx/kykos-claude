'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, X } from 'lucide-react';
import QRCodeCard from '@/components/qr/QRCodeCard';

interface QRData {
  multiAvailRequest: {
    id: string;
    title: string;
    status: string;
  };
  qrCode: {
    type: 'pickup';
    data: string;
    imageUrl: string;
    label: string;
    description: string;
  };
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

export default function MultiAvailPickupPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHoursModal, setShowHoursModal] = useState(false);

  useEffect(() => {
    fetchQRData();
  }, [requestId]);

  const fetchQRData = async () => {
    try {
      const res = await fetch(`/api/recipient/multi-avail-request/${requestId}/qr`);
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
          <p className="text-error-600 mb-4">{error || 'Dati non trovati'}</p>
          <Link href="/recipient/to-deliver-and-pickup" className="text-primary-600 hover:underline">
            ← Torna alla lista
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-block">
            ← Indietro
          </button>
          <h1 className="text-2xl font-bold text-gray-900">QR Code per il ritiro</h1>
          <p className="text-gray-500">{data.multiAvailRequest.title}</p>
        </div>

        <div className="max-w-md mx-auto">
          <QRCodeCard
            type={data.qrCode.type}
            data={data.qrCode.data}
            imageUrl={data.qrCode.imageUrl}
            label={data.qrCode.label}
            description={data.qrCode.description}
            objectTitle={data.multiAvailRequest.title}
          />

          {data.entityHoursInfo && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowHoursModal(true)}
                className="px-6 py-2.5 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 font-medium text-sm flex items-center gap-2"
              >
                <Clock className="w-4 h-4" aria-hidden="true" /> Orari Ente
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
                  <Clock className="w-5 h-5 text-gray-600" aria-hidden="true" /> Orari {data.entityName}
                </h3>
                <button
                  type="button"
                  aria-label="Chiudi modale orari"
                  onClick={() => setShowHoursModal(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
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
