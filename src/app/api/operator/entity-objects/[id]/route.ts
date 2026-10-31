import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { getJwtSecret } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';
import { hasAnyPermission } from '@/lib/permissions';
import {
  ENTITY_REVOCABLE_STATUSES,
  canRevokeEntityObject,
} from '@/lib/entity-history';

const JWT_SECRET = getJwtSecret();

interface OperatorSession {
  operatorId: string;
  organizationId: string;
  username: string;
  role: string;
}

async function getOperatorSession(): Promise<OperatorSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('operator_session')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as OperatorSession;
  } catch {
    return null;
  }
}

/**
 * PATCH /api/operator/entity-objects/[id]
 *
 * Revoca di una disponibilità pubblicata dall'ente.
 *
 * Body: `{ "action": "revoke" }`
 *
 * Regole (stesso predicato usato dalla UI, vedi `canRevokeEntityObject`):
 * - l'oggetto deve essere dell'ente della sessione (`publishedByOrgId`);
 * - nessuna richiesta attiva (PENDING/APPROVED) sull'oggetto;
 * - stato tra `AVAILABLE` e `DEPOSITED` (non ancora consegnato).
 *
 * La revoca NON cancella l'oggetto: lo porta in `CANCELLED`, così la
 * disponibilità sparisce dal magazzino (non è più offerta ai beneficiari)
 * ma l'ente conserva la tracciabilità di ciò che ha pubblicato e revocato.
 */
export const PATCH = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getOperatorSession();

  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const operator = await prisma.operator.findUnique({
    where: { id: session.operatorId },
  });

  if (!operator || !operator.active) {
    return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
  }

  if (!hasAnyPermission(operator.role, operator.permissions, ['ORGANIZATION_ADMIN'])) {
    return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
  }

  const { id: objectId } = await params;

  const body = await request.json().catch(() => ({}));
  if (body?.action !== 'revoke') {
    return NextResponse.json({ error: 'Azione non supportata' }, { status: 400 });
  }

  // Scope: solo le disponibilità pubblicate da QUESTO ente.
  const object = await prisma.object.findFirst({
    where: { id: objectId, publishedByOrgId: session.organizationId },
    select: {
      id: true,
      title: true,
      status: true,
      _count: {
        select: {
          requests: { where: { status: { in: ['PENDING', 'APPROVED'] } } },
        },
      },
    },
  });

  if (!object) {
    return NextResponse.json({ error: 'Disponibilità non trovata' }, { status: 404 });
  }

  if (!canRevokeEntityObject(object.status, object._count.requests)) {
    if (object._count.requests > 0) {
      return NextResponse.json(
        {
          error:
            'La disponibilità ha richieste attive: rifiuta o annulla le richieste prima di revocarla.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'La disponibilità non è revocabile perché non è più in giacenza.' },
      { status: 409 }
    );
  }

  // Aggiornamento atomico: il filtro replica i guard del check precedente,
  // così una richiesta arrivata nel frattempo (o un cambio di stato)
  // impedisce la revoca invece di passare inosservata.
  const result = await prisma.object.updateMany({
    where: {
      id: objectId,
      publishedByOrgId: session.organizationId,
      status: { in: [...ENTITY_REVOCABLE_STATUSES] },
      requests: { none: { status: { in: ['PENDING', 'APPROVED'] } } },
    },
    data: { status: 'CANCELLED' },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: 'La disponibilità è cambiata nel frattempo: ricarica la pagina.' },
      { status: 409 }
    );
  }

  return NextResponse.json({
    success: true,
    object: { id: object.id, title: object.title, status: 'CANCELLED' },
  });
}, 'PATCH /api/operator/entity-objects/[id]');
