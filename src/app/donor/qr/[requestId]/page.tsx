'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import QRCodeCard from '@/components/qr/QRCodeCard';

interface QRData {
  donation: {
    id: string;
    objectTitle: string;
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
  userType: 'donor' | 'recipient';
}

export default function DonorQRPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = use(params);
  const [data, setData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQRData();
  }, [requestId]);

  const fetchQRData = async () => {
    try {
      const res = await fetch(`/api/donation/${requestId}/qr`);
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
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary-600">KYKOS</Link>
            <nav className="flex items-center gap-6">
              <Link href="/donor/dashboard" className="text-primary-600 font-medium">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/donor/dashboard" className="text-sm text-gray-500 hover:text-primary-600 mb-2 inline-flex items-center gap-1">
            ← Torna alla dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">QR Code per la donazione</h1>
          <p className="text-gray-500">{data.donation.objectTitle}</p>
        </div>

        <div className="max-w-md mx-auto">
          <QRCodeCard
            type={data.qrCodes.deliver.type}
            data={data.qrCodes.deliver.data}
            imageUrl={data.qrCodes.deliver.imageUrl}
            label={data.qrCodes.deliver.label}
            description={data.qrCodes.deliver.description}
            objectTitle={data.donation.objectTitle}
          />
        </div>
      </main>
    </div>
  );
}
