import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getSession } from '@/lib/auth';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

async function getOperatorSession(): Promise<{ organizationId: string } | null> {
  const token = (await cookies()).get('operator_session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as { organizationId: string };
  } catch {
    return null;
  }
}

export default async function PwaEntry() {
  const session = await getSession();
  if (session) {
    const map: Record<string, string> = {
      DONOR: '/donor/dashboard',
      RECIPIENT: '/recipient/dashboard',
      INTERMEDIARY: '/intermediary/dashboard',
      ADMIN: '/admin/dashboard',
    };
    redirect(map[session.role] ?? '/');
  }

  if (await getOperatorSession()) {
    redirect('/operator/dashboard');
  }

  redirect('/');
}
