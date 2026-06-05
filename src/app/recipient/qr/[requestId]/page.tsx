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
 * /recipient/qr/[requestId] — QR code RITIRO per un oggetto ricevuto.
 * Il ricevente mostra questo QR all'ente per ritirare l'oggetto.
 */
export default function RecipientQrPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = use(params);

  return (
    <QrPage
      title="QR Code per il ritiro"
      apiUrl={`/api/donation/${requestId}/qr`}
      backHref="/recipient/dashboard"
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
