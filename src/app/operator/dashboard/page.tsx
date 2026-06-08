import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { Clock, CheckCircle2, Package, Users } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getJwtSecret } from '@/lib/auth';
import { redirect } from 'next/navigation';

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

export default async function OperatorDashboard() {
  const session = await getOperatorSession();

  if (!session) {
    redirect('/operator/login');
  }

  const operator = await prisma.operator.findUnique({
    where: { id: session.operatorId },
    include: {
      organization: {
        include: {
          _count: {
            select: {
              objects: true,
              requests: true,
              operators: true,
            },
          },
        },
      },
    },
  });

  if (!operator || !operator.active) {
    redirect('/operator/login');
  }

  const [pendingRequests, authorizedRecipients] = await Promise.all([
    prisma.request.count({
      where: { intermediaryId: operator.organizationId, status: 'PENDING' },
    }),
    prisma.user.count({
      where: { referenceEntityId: operator.organizationId, authorized: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ciao, {operator.firstName} {operator.lastName}
          </h1>
          <p className="text-gray-500">{operator.organization.name}</p>
        </div>
        <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium">
          {operator.role}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Richieste in attesa</p>
              <p className="text-2xl font-bold text-gray-900">{pendingRequests}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Beneficiari autorizzati</p>
              <p className="text-2xl font-bold text-gray-900">{authorizedRecipients}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-700" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Disponibilità</p>
              <p className="text-2xl font-bold text-gray-900">{operator.organization._count.objects}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-secondary-700" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Operatori ente</p>
              <p className="text-2xl font-bold text-gray-900">{operator.organization._count.operators}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
