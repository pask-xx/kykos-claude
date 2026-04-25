import QRCode from 'qrcode';

export async function generateQrCodeDataUrl(data: string): Promise<string> {
  const dataUrl = await QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: {
      dark: '#1f2937',
      light: '#ffffff',
    },
  });
  return dataUrl;
}

export function generateDeliverQrCode(requestId: string, donorId: string): string {
  return `kykos:deliver:${requestId}:${donorId}`;
}

export function generatePickupQrCode(requestId: string, beneficiaryId: string): string {
  return `kykos:pickup:${requestId}:${beneficiaryId}`;
}

export function parseQrCodeData(data: string): { type: 'deliver' | 'pickup'; requestId: string; userId: string } | null {
  if (typeof data !== 'string') return null;

  const deliverMatch = data.match(/^kykos:deliver:(.+):(.+)$/);
  if (deliverMatch) {
    return { type: 'deliver', requestId: deliverMatch[1], userId: deliverMatch[2] };
  }

  const pickupMatch = data.match(/^kykos:pickup:(.+):(.+)$/);
  if (pickupMatch) {
    return { type: 'pickup', requestId: pickupMatch[1], userId: pickupMatch[2] };
  }

  return null;
}
