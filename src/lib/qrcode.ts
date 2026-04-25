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

export function parseQrCodeData(data: string): { requestId: string; recipientId: string } | null {
  const match = data.match(/^kykos:pickup:(.+):(.+)$/);
  if (match) {
    return { requestId: match[1], recipientId: match[2] };
  }
  return null;
}
