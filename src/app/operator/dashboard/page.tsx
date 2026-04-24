import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

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
              <span className="text-2xl">⏳</span>
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
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Riceventi autorizzati</p>
              <p className="text-2xl font-bold text-gray-900">{authorizedRecipients}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Oggetti totali</p>
              <p className="text-2xl font-bold text-gray-900">{operator.organization._count.objects}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Operatori ente</p>
              <p className="text-2xl font-bold text-gray-900">{operator.organization._count.operators}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Azioni rapide</h2>
        <div className="flex gap-4 flex-wrap">
          <a
            href="/operator/requests"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            Gestisci richieste
          </a>
          <a
            href="/operator/recipients"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Autorizza riceventi
          </a>
        </div>
      </div>
    </div>
  );
}
