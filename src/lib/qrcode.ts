import QRCode from 'qrcode';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function generateQrCodeDataUrl(data: string): Promise<string> {
  const dataUrl = await QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: {
      dark: '#059669',
      light: '#ffffff',
    },
  });
  return dataUrl;
}

export async function generateAndUploadQrCode(data: string, filename: string): Promise<string> {
  const dataUrl = await generateQrCodeDataUrl(data);

  // Convert base64 to buffer
  const base64Data = dataUrl.split(',')[1];
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const buffer = Buffer.from(bytes);

  // Upload to Supabase storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('qr-codes')
    .upload(filename, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (uploadError) {
    console.error('QR upload error:', uploadError);
    return dataUrl;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('qr-codes')
    .getPublicUrl(filename);

  return urlData.publicUrl;
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