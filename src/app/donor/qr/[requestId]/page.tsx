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
 * /donor/qr/[requestId] — QR code per la donazione di un oggetto.
 * Mostra il QR di RITIRO (il donatore può anche ritirare in caso di problemi).
 */
export default function DonorQrPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = use(params);

  return (
    <QrPage
      title="QR Code per la donazione"
      apiUrl={`/api/donation/${requestId}/qr`}
      backHref="/donor/dashboard"
      backLabel="Torna alla dashboard"
      qrType="pickup"
      transform={(raw): QrPayload => {
        const r = raw as DonationQrResponse;
        return {
          qrData: r.qrCodes.pickup.data,
          qrImageUrl: r.qrCodes.pickup.imageUrl,
          description: r.qrCodes.pickup.description,
          label: r.qrCodes.pickup.label,
          entityName: r.entityName,
          entityHoursInfo: r.entityHoursInfo,
        };
      }}
    />
  );
}
