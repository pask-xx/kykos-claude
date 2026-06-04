import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { getJwtSecret } from '@/lib/auth';
import { KYKOS_VIEWPORT } from '@/lib/layout-helper';
import OperatorSidebar from '@/components/operator/OperatorSidebar';

export const viewport = KYKOS_VIEWPORT;

const JWT_SECRET = getJwtSecret();

interface OperatorSession {
  operatorId: string;
  organizationId: string;
  username: string;
  role: string;
}

async function getOperatorSession(): Promise<OperatorSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('operator_session')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as OperatorSession;
  } catch {
    return null;
  }
}

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const session = await getOperatorSession();

  if (!session) {
    redirect('/operator/login');
  }

  const operator = await prisma.operator.findUnique({
    where: { id: session.operatorId },
    include: {
      organization: {
        select: { name: true },
      },
    },
  });

  // Also check if this operator has a linked user account with a profile photo
  let userProfileImageUrl: string | null = null;
  if (operator?.supabaseAuthId) {
    const linkedUser = await prisma.user.findFirst({
      where: { authUserId: operator.supabaseAuthId },
      select: { profileImageUrl: true },
    });
    userProfileImageUrl = linkedUser?.profileImageUrl || null;
  }

  if (!operator || !operator.active) {
    redirect('/operator/login');
  }

  return (
    <OperatorSidebar
      operatorRole={operator.role}
      operatorPermissions={operator.permissions}
      operatorName={`${operator.firstName} ${operator.lastName}`}
      operatorProfileImageUrl={operator.profileImageUrl || userProfileImageUrl}
      organizationName={operator.organization.name}
      isOfficeOperator={operator.isOfficeOperator}
      isStreetOperator={operator.isStreetOperator}
    >
      {children}
    </OperatorSidebar>
  );
}
