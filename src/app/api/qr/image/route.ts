import { NextResponse } from 'next/server';
import { generateQrCodeDataUrl, parseQrCodeData } from '@/lib/qrcode';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const data = searchParams.get('data');

    if (!data) {
      return NextResponse.json({ error: 'Data missing' }, { status: 400 });
    }

    const parsed = parseQrCodeData(data);
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid QR data' }, { status: 400 });
    }

    const imageUrl = await generateQrCodeDataUrl(data);
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('QR image API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
