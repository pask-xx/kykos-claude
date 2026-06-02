import { redirect } from 'next/navigation';
import { getSession, SessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dashboardPathForRole } from '@/lib/role-routes';
import { Role } from '@/types';

export const KYKOS_VIEWPORT = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2563eb',
} as const;

/**
 * Shape returned by requireUserSession.
 * `name` is always populated, falling back through firstName+lastName,
 * then the raw `name` field, then the email — never empty.
 */
export interface LayoutUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  profileImageUrl: string | null;
}

/**
 * Centralized guard for user-role layouts (donor, recipient, intermediary, admin).
 *
 * - Returns 401-equivalent (redirects to /auth/login) if no session.
 * - Returns 403-equivalent (redirects to the user's own dashboard) if the
 *   caller is authenticated but not the expected role.
 * - Otherwise returns the session and a fully-shaped LayoutUser ready to
 *   be passed to DashboardLayoutClient.
 *
 * Each role-specific layout still owns its own extra queries (pending
 * deliveries, volunteer associations, etc.) — this helper only does the
 * common auth + user fetch, which used to be copy-pasted in 4 layouts.
 */
export async function requireUserSession(
  expectedRole: Role
): Promise<{ session: SessionUser; user: LayoutUser }> {
  const session = await getSession();
  if (!session) {
    redirect('/auth/login');
  }
  if (session.role !== expectedRole) {
    redirect(dashboardPathForRole(session.role));
  }

  const record = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      name: true,
      role: true,
      profileImageUrl: true,
    },
  });

  if (!record) {
    // User record missing despite a valid session. Treat as unauthenticated.
    redirect('/auth/login');
  }

  const user: LayoutUser = {
    id: record.id,
    email: record.email,
    name:
      record.name ||
      `${record.firstName || ''} ${record.lastName || ''}`.trim() ||
      record.email,
    role: record.role,
    profileImageUrl: record.profileImageUrl,
  };

  return { session, user };
}
