'use client';

import { use } from 'react';
import { QrPage, type QrPayload } from '@/components/qr/QrPage';

interface GoodsRequestQrResponse {
  goodsRequest: { id: string; title: string; status: string };
  qrCodes: {
    deliver: { type: 'deliver'; data: string; imageUrl: string; label: string; description: string };
    pickup: { type: 'pickup'; data: string; imageUrl: string; label: string; description: string };
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

/**
 * /donor/qr-goods/[requestId] — QR code CONSEGNA per donazione di bene/servizio.
 * Il donatore (fulfiller) mostra il QR all'ente per consegnare il bene.
 */
export default function DonorQrGoodsPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = use(params);

  return (
    <QrPage
      title="QR Code per la donazione"
      apiUrl={`/api/entity-requests/${requestId}/qr`}
      backHref="/donor/dashboard"
      backLabel="Torna alla dashboard"
      qrType="deliver"
      transform={(raw): QrPayload => {
        const r = raw as GoodsRequestQrResponse;
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
