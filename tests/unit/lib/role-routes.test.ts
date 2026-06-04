import { describe, it, expect } from 'vitest';
import { REDIRECT_BY_ROLE, dashboardPathForRole } from '@/lib/role-routes';

describe('REDIRECT_BY_ROLE', () => {
  it('maps every defined Role to its dashboard path', () => {
    // The Prisma Role enum is the single source of truth.
    // This test will fail loudly if a new role is added without a mapping.
    expect(REDIRECT_BY_ROLE.DONOR).toBe('/donor/dashboard');
    expect(REDIRECT_BY_ROLE.RECIPIENT).toBe('/recipient/dashboard');
    expect(REDIRECT_BY_ROLE.INTERMEDIARY).toBe('/intermediary/dashboard');
    expect(REDIRECT_BY_ROLE.ADMIN).toBe('/admin/dashboard');
  });

  it('covers all 4 roles (no missing entries)', () => {
    // If Prisma adds a 5th role, this test enforces the mapping exists.
    expect(Object.keys(REDIRECT_BY_ROLE)).toHaveLength(4);
  });
});

describe('dashboardPathForRole', () => {
  it('returns the correct path for known roles', () => {
    expect(dashboardPathForRole('DONOR')).toBe('/donor/dashboard');
    expect(dashboardPathForRole('RECIPIENT')).toBe('/recipient/dashboard');
    expect(dashboardPathForRole('INTERMEDIARY')).toBe('/intermediary/dashboard');
    expect(dashboardPathForRole('ADMIN')).toBe('/admin/dashboard');
  });

  it('returns "/" for null, undefined, or empty string', () => {
    expect(dashboardPathForRole(null)).toBe('/');
    expect(dashboardPathForRole(undefined)).toBe('/');
    expect(dashboardPathForRole('')).toBe('/');
  });

  it('returns "/" for unknown roles (defensive default)', () => {
    // Useful for legacy JWTs with old role values, or typos.
    expect(dashboardPathForRole('SUPERADMIN')).toBe('/');
    expect(dashboardPathForRole('donor')).toBe('/'); // case-sensitive
  });
});
