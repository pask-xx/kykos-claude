import { Role } from '@prisma/client';

/**
 * Single source of truth for role-to-dashboard redirects.
 * Used by /pwa dispatch, /auth/callback, and any future entry point.
 */
export const REDIRECT_BY_ROLE: Record<Role, string> = {
  DONOR: '/donor/dashboard',
  RECIPIENT: '/recipient/dashboard',
  INTERMEDIARY: '/intermediary/dashboard',
  ADMIN: '/admin/dashboard',
};

export function dashboardPathForRole(role: Role | string | null | undefined): string {
  if (!role) return '/';
  return REDIRECT_BY_ROLE[role as Role] ?? '/';
}
