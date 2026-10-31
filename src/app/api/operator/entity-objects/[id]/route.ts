import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { Category, Condition } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getJwtSecret } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';
import { hasAnyPermission } from '@/lib/permissions';
import {
  ENTITY_EDITABLE_STATUSES,
  ENTITY_REPUBLISHABLE_STATUSES,
  ENTITY_REVOCABLE_STATUSES,
  canEditEntityObject,
  canRepublishEntityObject,
  canRevokeEntityObject,
  validateEntityObjectInput,
} from '@/lib/entity-object-rules';

const JWT_SECRET = getJwtSecret();

/** Stati di una richiesta che bloccano la revoca (stesso filtro del server). */
const ACTIVE_REQUEST_STATUSES = ['PENDING', 'APPROVED'] as const;

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

/** Normalizza un campo di testo libero in stringa o null. */
function optionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * PATCH /api/operator/entity-objects/[id]
 *
 * Azioni sulle disponibilità pubblicate dall'ente:
 * - `revoke`    → revoca (AVAILABLE/DEPOSITED → CANCELLED)
 * - `update`    → modifica titolo, descrizione, categoria, condizione,
 *                 foto, posizione e note di deposito
 * - `republish` → ripubblica una disponibilità revocata (CANCELLED → AVAILABLE)
 *
 * Body: `{ "action": "revoke" }`
 *        `{ "action": "update", "data": { ... } }`
 *        `{ "action": "republish" }`
 *
 * Regole (stessi predicati usati dalla UI, vedi `entity-object-rules.ts`):
 * - l'oggetto deve essere dell'ente della sessione (`publishedByOrgId`);
 * - nessuna richiesta attiva (PENDING/APPROVED) sull'oggetto quando si
 *   revoca o si ripubblica;
 * - stati coerenti con l'azione (non ancora consegnato / già revocato).
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
  const action = body?.action;

  if (action !== 'revoke' && action !== 'update' && action !== 'republish') {
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
          requests: { where: { status: { in: [...ACTIVE_REQUEST_STATUSES] } } },
        },
      },
    },
  });

  if (!object) {
    return NextResponse.json({ error: 'Disponibilità non trovata' }, { status: 404 });
  }

  // --- Modifica ------------------------------------------------------------------

  if (action === 'update') {
    if (!canEditEntityObject(object.status)) {
      return NextResponse.json(
        { error: 'La disponibilità non è modificabile perché non è più in giacenza.' },
        { status: 409 }
      );
    }

    const data = body?.data ?? {};
    const validationError = validateEntityObjectInput(data);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Aggiornamento atomico: il filtro replica il guard precedente, così
    // un cambio di stato concorrente impedisce la modifica.
    const result = await prisma.object.updateMany({
      where: {
        id: objectId,
        publishedByOrgId: session.organizationId,
        status: { in: [...ENTITY_EDITABLE_STATUSES] },
      },
      data: {
        title: String(data.title).trim(),
        description: optionalText(data.description),
        category: data.category as Category,
        condition: data.condition as Condition,
        imageUrls: data.imageUrls as string[],
        depositLocation: optionalText(data.depositLocation),
        depositNotes: optionalText(data.depositNotes),
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'La disponibilità è cambiata nel frattempo: ricarica la pagina.' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      object: { id: object.id, title: String(data.title).trim(), status: object.status },
    });
  }

  // --- Ripubblicazione -----------------------------------------------------------

  if (action === 'republish') {
    if (!canRepublishEntityObject(object.status)) {
      return NextResponse.json(
        { error: 'Solo una disponibilità revocata può essere ripubblicata.' },
        { status: 409 }
      );
    }

    const result = await prisma.object.updateMany({
      where: {
        id: objectId,
        publishedByOrgId: session.organizationId,
        status: { in: [...ENTITY_REPUBLISHABLE_STATUSES] },
        requests: { none: { status: { in: [...ACTIVE_REQUEST_STATUSES] } } },
      },
      data: { status: 'AVAILABLE' },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'La disponibilità è cambiata nel frattempo: ricarica la pagina.' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      object: { id: object.id, title: object.title, status: 'AVAILABLE' },
    });
  }

  // --- Revoca --------------------------------------------------------------------

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
      requests: { none: { status: { in: [...ACTIVE_REQUEST_STATUSES] } } },
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
