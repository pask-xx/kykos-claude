import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { OperatorPermission } from '@/types';
import { prisma } from '@/lib/prisma';
import { hasAnyPermission } from '@/lib/permissions';
import { getJwtSecret } from '@/lib/auth';

const JWT_SECRET = getJwtSecret();

export interface OperatorSession {
  operatorId: string;
  organizationId: string;
  username?: string;
  role?: string;
  permissions?: string[];
}

/**
 * Get the current operator session from the operator_session cookie.
 * Returns null if missing or invalid.
 */
export async function getOperatorSession(): Promise<OperatorSession | null> {
  const token = (await cookies()).get('operator_session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as OperatorSession;
  } catch {
    return null;
  }
}

export class OperatorAuthError extends Error {
  constructor(public status: 401 | 403 | 404, message: string) {
    super(message);
    this.name = 'OperatorAuthError';
  }
}

/**
 * Require a valid operator session AND an active operator record.
 * Throws OperatorAuthError on any failure (401/404).
 */
export async function requireOperator(): Promise<{
  session: OperatorSession;
  operator: NonNullable<Awaited<ReturnType<typeof prisma.operator.findUnique>>>;
}> {
  const session = await getOperatorSession();
  if (!session) {
    throw new OperatorAuthError(401, 'Sessione operatore non valida');
  }

  const operator = await prisma.operator.findUnique({
    where: { id: session.operatorId },
  });

  if (!operator || !operator.active) {
    throw new OperatorAuthError(404, 'Operatore non trovato o non attivo');
  }

  return { session, operator };
}

/**
 * Require a valid operator session + active operator + at least one of the given permissions.
 * Throws OperatorAuthError on any failure (401/403/404).
 */
export async function requireOperatorWithPermission(
  required: OperatorPermission | OperatorPermission[]
): Promise<{
  session: OperatorSession;
  operator: NonNullable<Awaited<ReturnType<typeof prisma.operator.findUnique>>>;
}> {
  const { session, operator } = await requireOperator();
  const requiredArray = Array.isArray(required) ? required : [required];
  if (!hasAnyPermission(operator.role, operator.permissions, requiredArray)) {
    throw new OperatorAuthError(403, 'Permesso negato');
  }
  return { session, operator };
}
