import { KYKOS_VIEWPORT, requireUserSession } from '@/lib/layout-helper';
import DashboardLayoutClient from '@/components/dashboard/DashboardLayoutClient';

export const viewport = KYKOS_VIEWPORT;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUserSession('ADMIN');

  return (
    <DashboardLayoutClient user={user}>
      {children}
    </DashboardLayoutClient>
  );
}
