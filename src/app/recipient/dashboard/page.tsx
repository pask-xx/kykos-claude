import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import RecipientFeedClient from '@/components/recipient/RecipientFeedClient';
import InstallAppBanner from '@/components/InstallAppBanner';

export default async function RecipientDashboard() {
  const session = await getSession();

  if (!session) {
    redirect('/auth/login');
  }

  if (session.role !== 'RECIPIENT') {
    redirect(`/${session.role.toLowerCase()}/dashboard`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      firstName: true,
      lastName: true,
      authorized: true,
      referenceEntity: {
        select: { name: true }
      }
    },
  });

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Ciao, {user?.firstName} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Ecco le disponibilità del tuo ente
        </p>
      </div>

      {/* Install App Banner */}
      <InstallAppBanner />

      {/* Authorization status */}
      {!user?.authorized && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-xl">⏳</span>
            </div>
            <div>
              <p className="font-medium text-amber-800">Account in attesa di autorizzazione</p>
              <p className="text-sm text-amber-600">
                Non puoi ancora richiedere oggetti. L'ente {user?.referenceEntity?.name || ''} deve autorizzarti.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feed - only for authorized users */}
      {user?.authorized ? (
        <RecipientFeedClient />
      ) : (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🔒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Account non autorizzato</h3>
          <p className="text-gray-500">Attendi l'autorizzazione dall'ente per visualizzare le disponibilità.</p>
        </div>
      )}
    </div>
  );
}