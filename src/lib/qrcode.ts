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