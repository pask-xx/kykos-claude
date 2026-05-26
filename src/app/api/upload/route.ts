import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

async function getUserIdFromOperatorSession(): Promise<string | null> {
  const cookieStore = await import('next/headers').then(m => m.cookies());
  const token = cookieStore.get('operator_session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.operatorId as string;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // Check user session OR operator session
    const session = await getSession();
    const operatorId = await getUserIdFromOperatorSession();

    const userId = session?.id || operatorId;
    if (!userId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nessun file fornito' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo di file non supportato' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File troppo grande (max 5MB)' }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const id = session?.id || operatorId || 'anonymous';
    const filename = `${id}/${Date.now()}.${ext}`;

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload via Supabase REST API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/objects/${filename}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': file.type,
          'x-upsert': 'false',
        },
        body: buffer,
      }
    );

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error('Upload error:', uploadRes.status, errorText);
      return NextResponse.json({ error: 'Errore durante upload', details: errorText }, { status: 500 });
    }

    // Get public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/objects/${filename}`;

    return NextResponse.json({ url: publicUrl, path: filename });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
