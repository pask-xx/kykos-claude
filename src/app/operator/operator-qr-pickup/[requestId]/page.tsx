'use client';

import { use } from 'react';
import { QrPage } from '@/components/qr/QrPage';

interface QrApiResponse {
  qrData: string;
  qrImageUrl: string;
  title: string;
  description: string;
  label: string;
  entityName: string;
  entityHoursInfo: string | null;
  beneficiary: { id: string; name: string };
}

/**
 * /operator/operator-qr-pickup/[requestId] — Pagina QR ritiro per
 * un OBJECT DEPOSITED di un beneficiario gestito da street operator.
 *
 * Sostituisce il vecchio qrLink rotto `/operator/scan-qr/pickup/[id]`
 * (che non esisteva come pagina). L'operatore mostra il QR al
 * beneficiario, che lo scansiona per confermare il ritiro.
 *
 * Usa <QrPage> riusando tutta la logica di fetch/loading/errore + 5 azioni
 * standard (Condividi, Email, WhatsApp, Download, Stampa).
 *
 * Anonimato: NON mostra il nome del donatore, solo il titolo dell'oggetto
 * (regola KYKOS: lo street operator vede i nomi SOLO per la logistica
 * fisica, non per identificare il donatore dell'oggetto ritirato).
 */
export default function OperatorQrPickupPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = use(params);

  return (
    <QrPage
      title="QR Ritiro"
      apiUrl={`/api/operator/operator-qr-pickup/${requestId}`}
      qrType="pickup"
      transform={(raw) => {
        const r = raw as QrApiResponse;
        return {
          qrData: r.qrData,
          qrImageUrl: r.qrImageUrl,
          description: r.description,
          label: r.label,
          entityName: r.entityName,
          entityHoursInfo: r.entityHoursInfo,
        };
      }}
    />
  );
}
