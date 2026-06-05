'use client';

import { use } from 'react';
import { QrPage, type QrPayload } from '@/components/qr/QrPage';

interface DonationQrResponse {
  donation: { id: string; objectTitle: string; status: string };
  qrCodes: {
    deliver: { type: 'deliver'; data: string; imageUrl: string; label: string; description: string };
    pickup: { type: 'pickup'; data: string; imageUrl: string; label: string; description: string };
  };
  userType: 'donor' | 'recipient';
  entityName: string;
  entityHoursInfo: string | null;
}

/**
 * /donor/delivery-qr/[requestId] — QR code per la CONSEGNA della donazione.
 * Pagina storica ridondante con /donor/qr/[requestId] (entrambe chiamano
 * stessa API), mantenuta per compatibilità con link esistenti.
 */
export default function DonorDeliveryQrPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = use(params);

  return (
    <QrPage
      title="QR Code per la consegna"
      apiUrl={`/api/donation/${requestId}/qr`}
      backHref="/donor/requests"
      backLabel="Torna alle donazioni"
      qrType="deliver"
      transform={(raw): QrPayload => {
        const r = raw as DonationQrResponse;
        return {
          qrData: r.qrCodes.deliver.data,
          qrImageUrl: r.qrCodes.deliver.imageUrl,
          description: r.qrCodes.deliver.description,
          label: r.qrCodes.deliver.label,
          entityName: r.entityName,
          entityHoursInfo: r.entityHoursInfo,
        };
      }}
    />
  );
}
