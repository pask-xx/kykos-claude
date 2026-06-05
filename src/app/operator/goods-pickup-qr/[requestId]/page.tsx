'use client';

import { use } from 'react';
import { QrPage, type QrPayload } from '@/components/qr/QrPage';

interface OperatorGoodsRequestQrResponse {
  goodsRequest: {
    id: string;
    title: string;
    status: string;
    beneficiary: { id: string; name: string; nickname: string | null } | null;
    fulfilledBy: { id: string; name: string } | null;
  };
  qrCodes: {
    deliver: { type: 'deliver'; data: string; imageUrl: string; label: string; description: string };
    pickup: { type: 'pickup'; data: string; imageUrl: string; label: string; description: string };
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

/**
 * /operator/goods-pickup-qr/[requestId] — QR code RITIRO mostrato dall'operatore
 * ufficio al beneficiario per ritirare un bene consegnato.
 */
export default function GoodsPickupQrPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = use(params);

  return (
    <QrPage
      title="QR Ritiro"
      apiUrl={`/api/operator/goods-requests/${requestId}/qr`}
      backLabel="Indietro"
      qrType="pickup"
      transform={(raw): QrPayload => {
        const r = raw as OperatorGoodsRequestQrResponse;
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
