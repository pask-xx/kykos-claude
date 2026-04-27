import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayoutClient from '@/components/dashboard/DashboardLayoutClient';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/auth/login');
  }

  if (session.role !== 'ADMIN') {
    redirect(`/${session.role.toLowerCase()}/dashboard`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      name: true,
      role: true,
    },
  });

  const userData = user ? {
    id: user.id,
    email: user.email,
    name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    role: user.role,
  } : null;

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">
          Sessione non trovata.{' '}
          <a href="/auth/login" className="text-primary-600 hover:underline">Accedi</a>
        </p>
      </div>
    );
  }

  return (
    <DashboardLayoutClient user={userData}>
      {children}
    </DashboardLayoutClient>
  );
}
