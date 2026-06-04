import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { dashboardPathForRole } from '@/lib/role-routes';
import { getOperatorSession } from '@/lib/operator-session';

export default async function PwaEntry() {
  const session = await getSession();
  if (session) {
    redirect(dashboardPathForRole(session.role));
  }

  if (await getOperatorSession()) {
    redirect('/operator/dashboard');
  }

  redirect('/');
}
