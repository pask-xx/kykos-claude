import QRCode from 'qrcode';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import path from 'path';

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

export async function generateQrCodeWithLogo(data: string): Promise<string> {
  // Generate QR code as raw PNG buffer
  const qrBuffer = await QRCode.toBuffer(data, {
    width: 300,
    margin: 2,
    color: {
      dark: '#059669',
      light: '#ffffff',
    },
    type: 'png',
  });

  // Load QR image
  let composite = await sharp(qrBuffer).toBuffer();

  // Create white circle using SVG mask (sharp doesn't have .circle())
  const circleSvg = `
    <svg width="80" height="80">
      <circle cx="40" cy="40" r="40" fill="white"/>
    </svg>
  `;
  const circleBuffer = Buffer.from(circleSvg);

  // Center coordinates for 300x300 QR
  const qrSize = 300;
  const offset = (qrSize - 80) / 2;

  // Composite white circle in center
  composite = await sharp(composite)
    .composite([{
      input: circleBuffer,
      left: offset,
      top: offset,
    }])
    .toBuffer();

  // Load and composite logo (albero) in center - 50x50
  const logoPath = path.join(process.cwd(), 'public', 'albero.svg');
  const logoBuffer = await sharp(logoPath)
    .resize(50, 50)
    .png()
    .toBuffer();

  const logoOffset = (qrSize - 50) / 2;
  composite = await sharp(composite)
    .composite([{
      input: logoBuffer,
      left: logoOffset,
      top: logoOffset,
    }])
    .toBuffer();

  return composite.toString('base64');
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

export async function generateAndUploadQrCodeWithLogo(data: string, filename: string): Promise<string> {
  // Generate QR with logo embedded (returns base64 without data:image prefix)
  const base64Data = await generateQrCodeWithLogo(data);
  const buffer = Buffer.from(base64Data, 'base64');

  // Upload to Supabase storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('qr-codes')
    .upload(filename, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (uploadError) {
    console.error('QR with logo upload error:', uploadError);
    // Fallback: return data URL (without logo)
    return await generateAndUploadQrCode(data, filename);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('qr-codes')
    .getPublicUrl(filename);

  return urlData.publicUrl;
}

export function generateDeliverQrCode(requestId: string, userId: string, type: 'object' | 'goods' = 'object'): string {
  return `kykos:${type}:deliver:${requestId}:${userId}`;
}

export function generatePickupQrCode(requestId: string, userId: string, type: 'object' | 'goods' = 'object'): string {
  return `kykos:${type}:pickup:${requestId}:${userId}`;
}

export function parseQrCodeData(data: string): { type: 'deliver' | 'pickup'; subType: 'object' | 'goods'; requestId: string; userId: string } | null {
  if (typeof data !== 'string') {
    console.log('parseQrCodeData: data is not a string, got:', typeof data);
    return null;
  }

  console.log('parseQrCodeData: parsing', data);

  // New format: kykos:{subType}:deliver/pickup:requestId:userId
  const newMatch = data.match(/^kykos:(object|goods|multiavailability):(deliver|pickup):(.+):(.+)$/);
  if (newMatch) {
    console.log('parseQrCodeData: matched new format, subType=', newMatch[1], 'action=', newMatch[2], 'requestId=', newMatch[3], 'userId=', newMatch[4]);
    return { type: newMatch[2] as 'deliver' | 'pickup', subType: newMatch[1] as 'object' | 'goods', requestId: newMatch[3], userId: newMatch[4] };
  }

  // Legacy format: kykos:deliver/pickup:requestId:userId (treated as object type for backward compatibility)
  const legacyDeliverMatch = data.match(/^kykos:deliver:(.+):(.+)$/);
  if (legacyDeliverMatch) {
    console.log('parseQrCodeData: matched legacy deliver, requestId=', legacyDeliverMatch[1], 'userId=', legacyDeliverMatch[2]);
    return { type: 'deliver', subType: 'object', requestId: legacyDeliverMatch[1], userId: legacyDeliverMatch[2] };
  }

  const legacyPickupMatch = data.match(/^kykos:pickup:(.+):(.+)$/);
  if (legacyPickupMatch) {
    console.log('parseQrCodeData: matched legacy pickup, requestId=', legacyPickupMatch[1], 'userId=', legacyPickupMatch[2]);
    return { type: 'pickup', subType: 'object', requestId: legacyPickupMatch[1], userId: legacyPickupMatch[2] };
  }

  console.log('parseQrCodeData: no match found, data length:', data.length);
  return null;
}

export function generateMultiAvailabilityQrCode(requestId: string, beneficiaryId: string): string {
  return `kykos:multiavailability:pickup:${requestId}:${beneficiaryId}`;
}