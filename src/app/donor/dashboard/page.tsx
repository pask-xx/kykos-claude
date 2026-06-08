import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Sparkles } from 'lucide-react';
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
            Ciao, {user?.firstName}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Ecco le richieste che puoi soddisfare.
          </p>
        </div>
      </div>

      {/* Services notice */}
      {user?.canProvideServices && (
        <div className="mb-4 p-3 bg-secondary-50 border border-secondary-100 rounded-xl flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-secondary-600 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-secondary-800">Puoi offrire servizi</p>
            <p className="text-xs text-secondary-600">Vedrai anche richieste di servizi</p>
          </div>
        </div>
      )}
      {/* Requests Feed */}
      <DonorRequestsClient />
    </div>
  );
}