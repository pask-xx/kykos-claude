import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

async function getOperatorId(): Promise<string | null> {
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
    const operatorId = await getOperatorId();

    console.log('Profile photo upload - session:', session);
    console.log('Profile photo upload - operatorId:', operatorId);

    const userId = session?.id;
    const isOperator = !!operatorId;

    console.log('User ID from session:', userId);

    if (!userId && !operatorId) {
      console.log('Unauthorized - no user or operator session');
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      console.log('No file provided');
      return NextResponse.json({ error: 'Nessun file fornito' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo di file non supportato. Usa JPG, PNG o WebP.' }, { status: 400 });
    }

    // Validate file size (max 2MB for profile photos)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File troppo grande (max 2MB)' }, { status: 400 });
    }

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload via Supabase REST API to profile-photos bucket
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
    const targetId = userId || operatorId;
    const filename = `${targetId}/photo.jpg`;

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/profile-photos/${filename}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': file.type,
          'x-upsert': 'true',
        },
        body: buffer,
      }
    );

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error('Profile photo upload error:', uploadRes.status, errorText);
      return NextResponse.json({ error: 'Errore durante upload' }, { status: 500 });
    }

    // Get public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/profile-photos/${filename}`;

    console.log('Profile photo uploaded:', publicUrl);
    console.log('Updating user ID:', userId, 'isOperator:', isOperator);

    // Update user or operator record
    if (isOperator && operatorId) {
      const updated = await prisma.operator.update({
        where: { id: operatorId },
        data: { profileImageUrl: publicUrl },
      });
      console.log('Operator updated:', updated.id, 'profileImageUrl:', updated.profileImageUrl);
    } else if (userId) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { profileImageUrl: publicUrl },
      });
      console.log('User updated:', updated.id, 'profileImageUrl:', updated.profileImageUrl);
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}