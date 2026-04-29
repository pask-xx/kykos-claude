import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kykos-secret-key-change-in-production'
);

export async function createUserSessionCookie(userId: string, role: string = 'DONOR') {
  const token = await new SignJWT({ user: { id: userId, role } })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return `session=${token}; Path=/; HttpOnly; SameSite=Lax`;
}

export async function createOperatorSessionCookie(
  operatorId: string,
  organizationId: string,
  role: string = 'OPERATORE',
  permissions: string[] = []
) {
  const token = await new SignJWT({
    operatorId,
    organizationId,
    role,
    permissions,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return `operator_session=${token}; Path=/; HttpOnly; SameSite=Lax`;
}
