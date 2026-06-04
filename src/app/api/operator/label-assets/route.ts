import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { withErrorHandler } from '@/lib/api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export const GET = withErrorHandler(async () => {

  const uploads: { name: string; buffer: Buffer }[] = [];

  // Process albero.svg with specific options for printer compatibility
  const alberoPath = path.join(process.cwd(), 'public', 'albero.svg');
  const alberoBuffer = await sharp(alberoPath)
    .resize(80, 80)
    .removeAlpha()
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      progressive: false,
    })
    .toBuffer();
  uploads.push({ name: 'labels/albero.png', buffer: alberoBuffer });

  // Process LogoKykosTesto.svg with specific options for printer compatibility
  const logoPath = path.join(process.cwd(), 'public', 'LogoKykosTesto.svg');
  const logoBuffer = await sharp(logoPath)
    .resize(200, 50)
    .removeAlpha()
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      progressive: false,
    })
    .toBuffer();
  uploads.push({ name: 'labels/LogoKykosTesto.png', buffer: logoBuffer });

  // Upload both with overwrite
  for (const { name, buffer } of uploads) {
    const { error } = await supabase.storage
      .from('labels')
      .upload(name, buffer, {
        contentType: 'image/png',
        upsert: true,
      });
    if (error) {
      console.error(`Upload error for ${name}:`, error);
    }
  }

  const alberoUrl = supabase.storage.from('labels').getPublicUrl('labels/albero.png').data.publicUrl;
  const logoUrl = supabase.storage.from('labels').getPublicUrl('labels/LogoKykosTesto.png').data.publicUrl;

  return NextResponse.json({
    albero: alberoUrl,
    logo: logoUrl,
  });

}, 'GET /api/operator/label-assets');