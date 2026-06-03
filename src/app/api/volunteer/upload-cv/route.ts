import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getJwtSecret } from '@/lib/auth';
import { validateFileMagicBytes, ALLOWED_CV_MIMES } from '@/lib/file-validation';

const JWT_SECRET = getJwtSecret();

interface UserSession {
  userId: string;
  role: string;
}

async function getUserSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userPayload = payload.user as { id: string; role: string } | undefined;
    if (!userPayload?.id) return null;
    return { userId: userPayload.id, role: userPayload.role || 'DONOR' };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const session = await getUserSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nessun file fornito' }, { status: 400 });
    }

    // Validate file size (max 10MB for CV) - check before reading the buffer
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File troppo grande (max 10MB)' }, { status: 400 });
    }

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // A7: validate magic bytes (NOT the client-declared file.type)
    // CV can be PDF, DOC, DOCX, or images of a CV
    const validation = await validateFileMagicBytes(buffer, ALLOWED_CV_MIMES);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason + '. Usa PDF, DOC, DOCX o immagini.' },
        { status: 400 }
      );
    }

    // Generate unique filename using the REAL extension (not from client filename)
    const filename = `cvs/${session.userId}/${Date.now()}.${validation.detectedExt}`;

    // Upload via Supabase REST API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/objects/${filename}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': validation.detectedMime,
          'x-upsert': 'false',
        },
        body: buffer,
      }
    );

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error('CV upload error:', uploadRes.status, errorText);
      return NextResponse.json({ error: 'Errore durante upload' }, { status: 500 });
    }

    // Get public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/objects/${filename}`;

    return NextResponse.json({ url: publicUrl, path: filename });
  } catch (error) {
    console.error('CV upload error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}