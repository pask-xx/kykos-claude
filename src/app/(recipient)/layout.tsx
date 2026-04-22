import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import DashboardLayoutClient from '@/components/dashboard/DashboardLayoutClient';

export default async function RecipientLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/auth/login');
  }

  if (session.role !== 'RECIPIENT') {
    redirect(`/${session.role.toLowerCase()}/dashboard`);
  }

  return (
    <DashboardLayoutClient>
      {children}
    </DashboardLayoutClient>
  );
}
