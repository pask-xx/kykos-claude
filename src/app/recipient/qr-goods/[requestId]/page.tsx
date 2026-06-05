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
 * /recipient/qr-goods/[requestId] — QR code RITIRO per un bene richiesto.
 * Il beneficiario mostra questo QR all'ente per ritirare il bene.
 */
export default function RecipientQrGoodsPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = use(params);

  return (
    <QrPage
      title="QR Code per il ritiro"
      apiUrl={`/api/entity-requests/${requestId}/qr`}
      backHref="/recipient/requests-entity"
      backLabel="Torna alle richieste"
      qrType="pickup"
      transform={(raw): QrPayload => {
        const r = raw as GoodsRequestQrResponse;
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
