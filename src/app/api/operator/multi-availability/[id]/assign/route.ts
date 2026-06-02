import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hasAnyPermission } from '@/lib/permissions';
import { sendMultiAvailabilityQrNotification } from '@/lib/email';
import { generateAndUploadQrCodeWithLogo } from '@/lib/qrcode';
import { getJwtSecret } from '@/lib/auth';

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

// POST /api/operator/multi-availability/[id]/assign - Assegna beneficiari selezionati
//
// B1 fix: la vecchia implementazione leggeva `currentlyAssigned` e poi scriveva
// N update in loop, senza lock: due operatori in concorrenza potevano superare
// `availableQty`. Ora l'assegnazione avviene in una $transaction con update
// condizionato su `status: 'PENDING'`: ogni updateMany ritorna il numero di
// righe effettivamente transitate, e l'increment di `assignedQty` è una singola
// UPDATE atomica. Email e notifiche sono FUORI dalla transazione (best-effort).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const availability = await prisma.multiAvailability.findUnique({
      where: { id },
    });

    if (!availability || availability.organizationId !== session.organizationId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const { requestIds } = body;

    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      return NextResponse.json({ error: 'requestIds deve essere un array non vuoto' }, { status: 400 });
    }

    // Deduplica: requestIds ripetuti nello stesso payload non devono
    // far transpire la stessa riga due volte.
    const uniqueRequestIds = Array.from(new Set(requestIds));

    // Fetch beneficiari per i need score: serve per il needScoreSnapshot
    // una volta che la transazione è andata a buon fine.
    const requests = await prisma.multiAvailabilityRequest.findMany({
      where: {
        id: { in: uniqueRequestIds },
        multiAvailabilityId: id,
      },
      select: {
        id: true,
        beneficiaryId: true,
        status: true,
      },
    });

    if (requests.length === 0) {
      return NextResponse.json({ error: 'Nessuna richiesta trovata da assegnare' }, { status: 400 });
    }

    // --- Fase 1: transazione atomica per status + assignedQty ---------------
    // updateMany con where condizionato su `status: 'PENDING'` è atomico: la
    // count ritornata è il numero di righe effettivamente transitate. Se un
    // altro operatore ha già cambiato lo stato, count = 0.
    //
    // Ritorniamo claimedIds (gli id effettivamente transitati) invece di un
    // semplice count, così il loop successivo sa esattamente per quali
    // beneficiari inviare QR/email/notifica. Le righe che erano già in
    // ASSIGNED (race persa) NON vanno toccate.
    const txResult = await prisma.$transaction(async (tx) => {
      const claimedIds: string[] = [];
      for (const reqId of uniqueRequestIds) {
        const r = await tx.multiAvailabilityRequest.updateMany({
          where: { id: reqId, multiAvailabilityId: id, status: 'PENDING' },
          data: { status: 'ASSIGNED' },
        });
        if (r.count > 0) claimedIds.push(reqId);
      }

      // Capacity check: dopo l'update, assignedQty + claimed deve stare dentro availableQty.
      // Rileggo assignedQty aggiornato (altri operatori potrebbero aver
      // incrementato nello stesso momento) e verifico PRIMA di scrivere.
      const fresh = await tx.multiAvailability.findUnique({
        where: { id },
        select: { availableQty: true, assignedQty: true },
      });
      if (!fresh) {
        throw new Error('MultiAvailability disappeared mid-transaction');
      }
      const claimed = claimedIds.length;
      const free = fresh.availableQty - fresh.assignedQty;
      if (claimed > free) {
        // La transazione fa rollback automaticamente (throw).
        return { assigned: -claimed, remaining: free, claimedIds: [] as string[] };
      }
      // Increment atomico di assignedQty. Anche se due transazioni
      // concorrenti passano il check, l'increment è una singola UPDATE e
      // Postgres serializza gli update sulla stessa riga; l'eventuale
      // successiva transazione troverebbe assignedQty+claimed > availableQty
      // e farebbe rollback.
      if (claimed > 0) {
        await tx.multiAvailability.update({
          where: { id },
          data: { assignedQty: { increment: claimed } },
        });
      }
      return {
        assigned: claimed,
        remaining: fresh.availableQty - fresh.assignedQty - claimed,
        claimedIds,
      };
    });

    if (txResult.assigned < 0) {
      return NextResponse.json(
        { error: `Superata la quantità disponibile. Slot liberi: ${txResult.remaining}` },
        { status: 400 }
      );
    }

    const claimedIds = new Set(txResult.claimedIds);
    const claimedRequests = requests.filter((r) => claimedIds.has(r.id));

    if (claimedRequests.length === 0) {
      // Tutte le righe richieste erano già in uno stato non-PENDING (vinte da
      // un'altra race). Niente da fare, nessuna email da inviare.
      return NextResponse.json({
        success: true,
        assigned: 0,
        qrCodes: [],
        message: 'Nessuna richiesta era più in stato PENDING',
      });
    }

    // --- Fase 2: effetti collaterali (best-effort, FUORI dalla transazione) -
    // Recupera info organizzazione (singola query, condivisa da tutti i loop).
    const organization = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      select: {
        name: true,
        address: true,
        houseNumber: true,
        cap: true,
        city: true,
        province: true,
        phone: true,
        email: true,
        hoursInfo: true,
      },
    });

    // Mappa beneficiari per evitare query N+1 nel loop
    const beneficiaryIds = requests.map((r) => r.beneficiaryId);
    const beneficiaries = await prisma.user.findMany({
      where: { id: { in: beneficiaryIds } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        nickname: true,
        needScore: true,
      },
    });
    const beneficiaryById = new Map(beneficiaries.map((b) => [b.id, b]));

    const qrCodes: string[] = [];
    for (const req of claimedRequests) {
      const beneficiary = beneficiaryById.get(req.beneficiaryId);
      if (!beneficiary) continue;

      const qrCodeData = `kykos:multiavailability:pickup:${req.id}:${req.beneficiaryId}`;
      const qrCodeImageUrl = await generateAndUploadQrCodeWithLogo(qrCodeData, `multi-avail-${req.id}.png`);

      // Aggiorna qrCode + needScoreSnapshot (best-effort, FUORI tx:
      // se fallisce, lo stato è già corretto e il beneficiary potrà
      // richiedere un nuovo QR).
      try {
        await prisma.multiAvailabilityRequest.update({
          where: { id: req.id },
          data: {
            qrCode: qrCodeData,
            needScoreSnapshot: beneficiary.needScore ?? 50,
          },
        });
      } catch (err) {
        console.error(`Failed to attach QR/needScore to request ${req.id}:`, err);
      }
      qrCodes.push(qrCodeData);

      // Email + notifica (best-effort, errori loggati)
      const recipientName = [beneficiary.firstName, beneficiary.lastName].filter(Boolean).join(' ') || beneficiary.nickname || beneficiary.name || 'Beneficiario';
      try {
        await sendMultiAvailabilityQrNotification(
          beneficiary.email,
          req.beneficiaryId,
          recipientName,
          availability.title,
          availability.id,
          qrCodeData,
          qrCodeImageUrl,
          organization?.name || '',
          organization?.address || null,
          organization?.houseNumber || null,
          organization?.cap || null,
          organization?.city || null,
          organization?.province || null,
          organization?.phone || null,
          organization?.email || null,
          organization?.hoursInfo || undefined
        );
      } catch (emailErr) {
        console.error(`Failed to send QR email for request ${req.id}:`, emailErr);
      }

      try {
        await prisma.notification.create({
          data: {
            recipientUserId: req.beneficiaryId,
            recipientType: 'USER',
            title: `Assegnazione confermata: ${availability.title}`,
            message: `La tua richiesta per "${availability.title}" è stata accettata. Il tuo QR code per il ritiro è pronto.`,
            type: 'REQUEST_APPROVED' as any,
            link: '/recipient/dashboard',
          },
        });
      } catch (notifErr) {
        console.error(`Failed to create notification for request ${req.id}:`, notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      assigned: txResult.assigned,
      qrCodes,
    });
  } catch (error) {
    console.error('MultiAvailability assign error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
