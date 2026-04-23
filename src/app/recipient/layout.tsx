import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayoutClient from '@/components/dashboard/DashboardLayoutClient';

export default async function RecipientLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/auth/login');
  }

  if (session.role !== 'RECIPIENT') {
    redirect(`/${session.role.toLowerCase()}/dashboard`);
  }

  // Fetch full user data on server side
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });

  const userData = user ? {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`.trim(),
    role: user.role,
  } : null;

  return (
    <DashboardLayoutClient user={userData}>
      {children}
    </DashboardLayoutClient>
  );
}
