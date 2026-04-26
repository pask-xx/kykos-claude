import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import OperatorSidebar from '@/components/operator/OperatorSidebar';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

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

  if (!operator || !operator.active) {
    redirect('/operator/login');
  }

  return (
    <OperatorSidebar
      operatorRole={operator.role}
      operatorPermissions={operator.permissions}
      operatorName={`${operator.firstName} ${operator.lastName}`}
      organizationName={operator.organization.name}
    >
      {children}
    </OperatorSidebar>
  );
}
