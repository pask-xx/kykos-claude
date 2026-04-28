import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DonorRequestsClient from '@/components/donor/DonorRequestsClient';

export default async function DonorDashboard() {
  const session = await getSession();

  if (!session) {
    redirect('/auth/login');
  }

  if (session.role !== 'DONOR') {
    redirect(`/${session.role.toLowerCase()}/dashboard`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      firstName: true,
      canProvideServices: true,
    },
  });

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ciao, {user?.firstName} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Ecco le richieste che puoi soddisfare
          </p>
        </div>
        <Link
          href="/donor/statistics"
          className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium"
        >
          📊 Statistiche
        </Link>
      </div>

      {/* Services notice */}
      {user?.canProvideServices && (
        <div className="mb-4 p-3 bg-purple-50 border border-purple-100 rounded-xl flex items-center gap-3">
          <span className="text-xl">✨</span>
          <div>
            <p className="text-sm font-medium text-purple-800">Puoi offrire servizi</p>
            <p className="text-xs text-purple-600">Vedrai anche richieste di servizi</p>
          </div>
        </div>
      )}
      {!user?.canProvideServices && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
          <span className="text-xl">ℹ️</span>
          <div>
            <p className="text-sm font-medium text-amber-800">Solo beni disponibili</p>
            <p className="text-xs text-amber-600">Le richieste di servizi sono nascoste</p>
          </div>
        </div>
      )}

      {/* Requests Feed */}
      <DonorRequestsClient />
    </div>
  );
}