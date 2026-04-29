import { describe, it, expect } from 'vitest';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/permissions';

describe('hasPermission', () => {
  it('ADMIN role should have all permissions', () => {
    expect(hasPermission('ADMIN', [], 'RECIPIENT_AUTHORIZE')).toBe(true);
    expect(hasPermission('ADMIN', [], 'OBJECT_DELIVER')).toBe(true);
    expect(hasPermission('ADMIN', [], 'VOLUNTEER_MANAGE')).toBe(true);
    expect(hasPermission('ADMIN', [], 'ORGANIZATION_ADMIN')).toBe(true);
  });

  it('GESTORE_RICHIESTE should have RECIPIENT_AUTHORIZE and REQUEST_PROXY', () => {
    expect(hasPermission('GESTORE_RICHIESTE', [], 'RECIPIENT_AUTHORIZE')).toBe(true);
    expect(hasPermission('GESTORE_RICHIESTE', [], 'REQUEST_PROXY')).toBe(true);
    expect(hasPermission('GESTORE_RICHIESTE', [], 'OBJECT_DELIVER')).toBe(false);
  });

  it('GESTORE_OGGETTI should have OBJECT_RECEIVE and OBJECT_DELIVER', () => {
    expect(hasPermission('GESTORE_OGGETTI', [], 'OBJECT_RECEIVE')).toBe(true);
    expect(hasPermission('GESTORE_OGGETTI', [], 'OBJECT_DELIVER')).toBe(true);
    expect(hasPermission('GESTORE_OGGETTI', [], 'RECIPIENT_AUTHORIZE')).toBe(false);
  });

  it('GESTORE_VOLONTARI should have only VOLUNTEER_MANAGE', () => {
    expect(hasPermission('GESTORE_VOLONTARI', [], 'VOLUNTEER_MANAGE')).toBe(true);
    expect(hasPermission('GESTORE_VOLUNTARI', [], 'RECIPIENT_AUTHORIZE')).toBe(false);
  });

  it('OPERATORE should have no default permissions', () => {
    expect(hasPermission('OPERATORE', [], 'RECIPIENT_AUTHORIZE')).toBe(false);
    expect(hasPermission('OPERATORE', [], 'OBJECT_DELIVER')).toBe(false);
  });

  it('should check additional granular permissions', () => {
    expect(hasPermission('OPERATORE', ['RECIPIENT_AUTHORIZE'], 'RECIPIENT_AUTHORIZE')).toBe(true);
    expect(hasPermission('OPERATORE', ['OBJECT_DELIVER'], 'OBJECT_DELIVER')).toBe(true);
  });

  it('should return false for unknown roles', () => {
    expect(hasPermission('UNKNOWN_ROLE', [], 'RECIPIENT_AUTHORIZE')).toBe(false);
  });
});

describe('hasAnyPermission', () => {
  it('should return true if operator has any of the required permissions', () => {
    expect(hasAnyPermission('OPERATORE', ['RECIPIENT_AUTHORIZE'], ['RECIPIENT_AUTHORIZE', 'OBJECT_DELIVER'])).toBe(true);
    expect(hasAnyPermission('OPERATORE', ['OBJECT_DELIVER'], ['RECIPIENT_AUTHORIZE', 'OBJECT_DELIVER'])).toBe(true);
  });

  it('should return false if operator has none of the required permissions', () => {
    expect(hasAnyPermission('OPERATORE', [], ['RECIPIENT_AUTHORIZE', 'OBJECT_DELIVER'])).toBe(false);
  });
});

describe('hasAllPermissions', () => {
  it('should return true if operator has all required permissions', () => {
    expect(hasAllPermissions('ADMIN', [], ['RECIPIENT_AUTHORIZE', 'OBJECT_DELIVER'])).toBe(true);
  });

  it('should return false if operator is missing any permission', () => {
    expect(hasAllPermissions('GESTORE_RICHIESTE', [], ['RECIPIENT_AUTHORIZE', 'OBJECT_DELIVER'])).toBe(false);
  });
});
