import { OperatorPermission } from '@/types';

// Permissions by role - default mappings
export const ROLE_DEFAULT_PERMISSIONS: Record<string, OperatorPermission[]> = {
  ADMIN: [
    'RECIPIENT_AUTHORIZE',
    'OBJECT_RECEIVE',
    'OBJECT_DELIVER',
    'VOLUNTEER_MANAGE',
    'REQUEST_PROXY',
    'ORGANIZATION_ADMIN',
  ],
  GESTORE_RICHIESTE: [
    'RECIPIENT_AUTHORIZE',
    'REQUEST_PROXY',
  ],
  GESTORE_OGGETTI: [
    'OBJECT_RECEIVE',
    'OBJECT_DELIVER',
  ],
  GESTORE_VOLONTARI: [
    'VOLUNTEER_MANAGE',
  ],
  OPERATORE: [],
};

export const PERMISSION_LABELS: Record<OperatorPermission, string> = {
  RECIPIENT_AUTHORIZE: 'Abilitare utenti Riceventi',
  OBJECT_RECEIVE: 'Gestione entrata oggetti',
  OBJECT_DELIVER: 'Consegna oggetti al destinatario',
  VOLUNTEER_MANAGE: 'Organizzazione volontari',
  REQUEST_PROXY: 'Fare richieste per conto di utenti',
  ORGANIZATION_ADMIN: 'Amministrazione Ente',
};

export const PERMISSION_CATEGORIES: Record<string, OperatorPermission[]> = {
  'Utenti': ['RECIPIENT_AUTHORIZE'],
  'Oggetti': ['OBJECT_RECEIVE', 'OBJECT_DELIVER'],
  'Volontari': ['VOLUNTEER_MANAGE'],
  'Richieste': ['REQUEST_PROXY'],
  'Amministrazione': ['ORGANIZATION_ADMIN'],
};

export function hasPermission(
  operatorRole: string,
  operatorPermissions: string[],
  requiredPermission: OperatorPermission
): boolean {
  // Admin has all permissions
  if (operatorRole === 'ADMIN') return true;

  // Check role default permissions
  const rolePerms = ROLE_DEFAULT_PERMISSIONS[operatorRole] || [];
  if (rolePerms.includes(requiredPermission)) return true;

  // Check additional granular permissions
  if (operatorPermissions.includes(requiredPermission)) return true;

  return false;
}

export function hasAnyPermission(
  operatorRole: string,
  operatorPermissions: string[],
  requiredPermissions: OperatorPermission[]
): boolean {
  return requiredPermissions.some(p => hasPermission(operatorRole, operatorPermissions, p));
}

export function hasAllPermissions(
  operatorRole: string,
  operatorPermissions: string[],
  requiredPermissions: OperatorPermission[]
): boolean {
  return requiredPermissions.every(p => hasPermission(operatorRole, operatorPermissions, p));
}
