import { NextResponse } from 'next/server';
import { getSession, clearSessionCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';
import { ObjectStatus, GoodsOfferStatus, GoodsRequestStatus } from '@prisma/client';
import { withErrorHandler } from '@/lib/api';

interface ObjectPreview {
  id: string;
  title: string;
  status: ObjectStatus;
  requestId: string | null;
  willBe: string;
}

interface GoodsOfferPreview {
  id: string;
  requestTitle: string;
  status: GoodsOfferStatus;
  willBe: string;
}

interface RequestPreview {
  id: string;
  objectTitle: string;
  objectStatus: ObjectStatus;
  willBe: string;
}

interface GoodsRequestPreview {
  id: string;
  title: string;
  status: GoodsRequestStatus;
  offers: { id: string; status: GoodsOfferStatus }[];
  willBe: string;
}

interface DeactivationPreview {
  // Objects published by the user (as donor)
  objects: ObjectPreview[];
  // GoodsOffers made by the user on goods requests
  goodsOffers: GoodsOfferPreview[];
  // Requests made by the user (as recipient)
  requests: RequestPreview[];
  // GoodsRequests created by the user (as beneficiary)
  goodsRequests: GoodsRequestPreview[];
  // Summary
  canDeactivate: boolean;
  blockingReasons: string[];
}

export const GET = withErrorHandler(async () => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

    // 1. Get all objects published by this user (as donor)
    const objects = await prisma.object.findMany({
      where: { donorId: session.id },
      include: {
        requests: {
          where: { status: { in: ['PENDING', 'APPROVED'] } },
          select: { id: true, status: true },
        },
      },
    });

    // 2. Get all GoodsOffers made by this user
    const goodsOffers = await prisma.goodsOffer.findMany({
      where: { offeredById: session.id },
      include: {
        request: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    // 3. Get all Requests made by this user (as recipient)
    const requestsMade = await prisma.request.findMany({
      where: { recipientId: session.id },
      include: {
        object: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    // 4. Get all GoodsRequests created by this user (as beneficiary)
    const goodsRequestsCreated = await prisma.goodsRequest.findMany({
      where: { beneficiaryId: session.id },
      include: {
        offers: {
          select: { id: true, status: true },
        },
      },
    });

    const preview: DeactivationPreview = {
      objects: [],
      goodsOffers: [],
      requests: [],
      goodsRequests: [],
      canDeactivate: true,
      blockingReasons: [],
    };

    // === Analyze Objects (DONOR role) ===
    for (const obj of objects) {
      let willBe = 'Sarà cancellato';

      switch (obj.status) {
        case 'AVAILABLE':
          willBe = 'Sarà cancellato';
          break;
        case 'RESERVED':
          willBe = 'Sarà cancellato';
          break;
        case 'DEPOSITED':
          willBe = 'Invariato - già depositato';
          break;
        case 'DONATED':
          willBe = 'Invariato - già ritirato';
          break;
        case 'CANCELLED':
          willBe = 'Invariato';
          break;
        case 'BLOCKED':
          willBe = 'Invariato';
          break;
      }

      preview.objects.push({
        id: obj.id,
        title: obj.title,
        status: obj.status,
        requestId: obj.requests.length > 0 ? obj.requests[0].id : null,
        willBe,
      });
    }

    // === Analyze GoodsOffers ===
    for (const offer of goodsOffers) {
      let willBe = 'Sarà cancellata';

      switch (offer.status) {
        case 'PENDING':
          willBe = 'Sarà cancellata';
          break;
        case 'ACCEPTED':
          willBe = 'Sarà cancellata + notifica beneficiario';
          break;
        case 'REJECTED':
          willBe = 'Invariata';
          break;
        case 'CANCELLED':
          willBe = 'Invariata';
          break;
      }

      preview.goodsOffers.push({
        id: offer.id,
        requestTitle: offer.request.title,
        status: offer.status,
        willBe,
      });
    }

    // === Analyze Requests made (RECIPIENT role) ===
    // These depend on the ObjectStatus, not RequestStatus
    for (const req of requestsMade) {
      let willBe = 'Sarà cancellata';

      switch (req.object.status) {
        case 'AVAILABLE':
        case 'RESERVED':
          willBe = 'Sarà cancellata, oggetto torna disponibile';
          break;
        case 'DEPOSITED':
          willBe = 'Sarà cancellata + notifica ENTE per ripubblicazione';
          break;
        case 'DONATED':
          willBe = 'Invariato - transazione conclusa';
          break;
        case 'CANCELLED':
        case 'BLOCKED':
          willBe = 'Invariato';
          break;
      }

      preview.requests.push({
        id: req.id,
        objectTitle: req.object.title,
        objectStatus: req.object.status,
        willBe,
      });
    }

    // === Analyze GoodsRequests created (RECIPIENT role) ===
    for (const gr of goodsRequestsCreated) {
      let willBe = 'Sarà cancellata';

      switch (gr.status) {
        case 'PENDING':
          willBe = 'Sarà cancellata';
          break;
        case 'APPROVED':
          willBe = 'Sarà cancellata + offerte cancellate';
          break;
        case 'FULFILLED':
          willBe = 'Sarà cancellata + notifica DONATORE';
          break;
        case 'DELIVERED':
          willBe = 'Sarà cancellata + notifica ENTE per ripubblicazione';
          break;
        case 'COMPLETED':
          willBe = 'Invariato - transazione conclusa';
          break;
        case 'CANCELLED':
          willBe = 'Invariato';
          break;
      }

      preview.goodsRequests.push({
        id: gr.id,
        title: gr.title,
        status: gr.status,
        offers: gr.offers,
        willBe,
      });
    }

    return NextResponse.json({ preview });
}, 'GET /api/profile/deactivate');

export const POST = withErrorHandler(async () => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

    // ===================================================================
    // Step 1: cascade logico (DENTRO $transaction Prisma) ----------------
    // Tutte le mutazioni di stato delle entità correlate. Se fallisce,
    // rollback completo. La transazione NON tocca Supabase Auth.
    // ===================================================================
    const actions = await prisma.$transaction(async (tx) => {
      const out: string[] = [];

      // 1. Get all objects published by this user (as donor)
      const objects = await tx.object.findMany({
        where: { donorId: session.id },
        include: {
          requests: {
            where: { status: { in: ['PENDING', 'APPROVED'] } },
          },
        },
      });

      // 2. Get all GoodsOffers made by this user
      const goodsOffers = await tx.goodsOffer.findMany({
        where: { offeredById: session.id },
        include: {
          request: {
            select: { id: true, title: true, beneficiaryId: true },
          },
        },
      });

      // 3. Get all Requests made by this user (as recipient)
      const requestsMade = await tx.request.findMany({
        where: { recipientId: session.id },
        include: {
          object: {
            select: { id: true, title: true, status: true },
          },
        },
      });

      // 4. Get all GoodsRequests created by this user (as beneficiary)
      const goodsRequestsCreated = await tx.goodsRequest.findMany({
        where: { beneficiaryId: session.id },
        include: {
          offers: {
            where: { status: { in: ['PENDING', 'ACCEPTED'] } },
          },
          fulfilledBy: {
            select: { id: true, email: true, name: true },
          },
          intermediary: {
            select: { id: true },
            include: {
              operators: {
                where: { active: true },
                select: { id: true },
              },
            },
          },
        },
      });

      // === HANDLE OBJECTS (DONOR role) ===
      for (const obj of objects) {
        switch (obj.status) {
          case 'AVAILABLE':
            await tx.object.update({
              where: { id: obj.id },
              data: { status: 'CANCELLED' },
            });
            out.push(`Oggetto "${obj.title}" → CANCELLED`);
            break;

          case 'RESERVED':
            if (obj.requests.length > 0) {
              for (const req of obj.requests) {
                await tx.request.update({
                  where: { id: req.id },
                  data: { status: 'CANCELLED' },
                });

                const requestData = await tx.request.findUnique({
                  where: { id: req.id },
                  include: {
                    recipient: { select: { id: true, email: true, name: true } },
                  },
                });

                if (requestData?.recipient) {
                  await tx.notification.create({
                    data: {
                      recipientUserId: requestData.recipient.id,
                      recipientType: 'USER',
                      title: 'Oggetto non più disponibile',
                      message: `Il donatore ha cancellato la disponibilità dell'oggetto "${obj.title}". La richiesta è stata annullata.`,
                      type: 'OBJECT_CANCELLED',
                    },
                  });
                }
              }
            }

            await tx.object.update({
              where: { id: obj.id },
              data: { status: 'CANCELLED' },
            });
            out.push(`Oggetto "${obj.title}" → CANCELLED (Request annullata)`);
            break;

          case 'DEPOSITED':
          case 'DONATED':
          case 'CANCELLED':
          case 'BLOCKED':
            out.push(`Oggetto "${obj.title}" → ${obj.status} (invariato)`);
            break;
        }
      }

      // === HANDLE GOODS OFFERS ===
      for (const offer of goodsOffers) {
        switch (offer.status) {
          case 'PENDING':
            await tx.goodsOffer.update({
              where: { id: offer.id },
              data: { status: 'CANCELLED' },
            });
            out.push(`Offerta per "${offer.request.title}" → CANCELLED`);
            break;

          case 'ACCEPTED':
            await tx.goodsOffer.update({
              where: { id: offer.id },
              data: { status: 'CANCELLED' },
            });

            await tx.goodsRequest.update({
              where: { id: offer.requestId },
              data: {
                status: 'APPROVED',
                fulfilledById: null,
                fulfilledAt: null,
              },
            });

            await tx.notification.create({
              data: {
                recipientUserId: offer.request.beneficiaryId,
                recipientType: 'USER',
                title: 'Offerta annullata',
                message: `Il donatore ha annullato l'offerta per "${offer.request.title}". L'ente potrà valutare altre offerte.`,
                type: 'GOODS_OFFER_RECEIVED',
              },
            });

            out.push(`Offerta per "${offer.request.title}" → CANCELLED + richiesta torna APPROVATA`);
            break;

          case 'REJECTED':
          case 'CANCELLED':
            out.push(`Offerta per "${offer.request.title}" → ${offer.status} (invariata)`);
            break;
        }
      }

      // === HANDLE REQUESTS MADE (RECIPIENT role) ===
      for (const req of requestsMade) {
        switch (req.object.status) {
          case 'AVAILABLE':
          case 'RESERVED':
            await tx.request.update({
              where: { id: req.id },
              data: { status: 'CANCELLED' },
            });

            await tx.object.update({
              where: { id: req.object.id },
              data: { status: 'AVAILABLE' },
            });

            out.push(`Richiesta per "${req.object.title}" → CANCELLED, oggetto torna disponibile`);
            break;

          case 'DEPOSITED':
            await tx.request.update({
              where: { id: req.id },
              data: { status: 'CANCELLED' },
            });

            // Notify entity operators
            const entityOperators = await tx.operator.findMany({
              where: { organizationId: req.intermediaryId, active: true },
            });

            for (const op of entityOperators) {
              await tx.notification.create({
                data: {
                  recipientOperatorId: op.id,
                  recipientType: 'OPERATOR',
                  title: 'Richiesta cancellata',
                  message: `Il beneficiario ha cancellato la richiesta per "${req.object.title}". L'oggetto depositato deve essere ripubblicato.`,
                  type: 'OBJECT_CANCELLED',
                },
              });
            }

            out.push(`Richiesta per "${req.object.title}" → CANCELLED + notifica ENTE`);
            break;

          case 'DONATED':
            out.push(`Richiesta per "${req.object.title}" → DONATED (invariata - già completata)`);
            break;

          case 'CANCELLED':
          case 'BLOCKED':
            out.push(`Richiesta per "${req.object.title}" → ${req.object.status} (invariata)`);
            break;
        }
      }

      // === HANDLE GOODS REQUESTS CREATED (RECIPIENT role) ===
      for (const gr of goodsRequestsCreated) {
        switch (gr.status) {
          case 'PENDING':
            await tx.goodsRequest.update({
              where: { id: gr.id },
              data: { status: 'CANCELLED' },
            });
            out.push(`Richiesta beni "${gr.title}" → CANCELLED`);
            break;

          case 'APPROVED':
            // Cancel all pending/accepted offers
            for (const offer of gr.offers) {
              await tx.goodsOffer.update({
                where: { id: offer.id },
                data: { status: 'CANCELLED' },
              });
            }

            await tx.goodsRequest.update({
              where: { id: gr.id },
              data: { status: 'CANCELLED' },
            });
            out.push(`Richiesta beni "${gr.title}" → CANCELLED + ${gr.offers.length} offerte cancellate`);
            break;

          case 'FULFILLED':
            // Notify the donor who fulfilled this request
            if (gr.fulfilledBy) {
              await tx.notification.create({
                data: {
                  recipientUserId: gr.fulfilledBy.id,
                  recipientType: 'USER',
                  title: 'Richiesta beni annullata',
                  message: `Il beneficiario ha annullato la richiesta beni "${gr.title}" che avevi accettato. La transazione è stata annullata.`,
                  type: 'GOODS_REQUEST_REJECTED',
                },
              });
            }

            await tx.goodsRequest.update({
              where: { id: gr.id },
              data: { status: 'CANCELLED' },
            });
            out.push(`Richiesta beni "${gr.title}" → CANCELLED + notifica DONATORE`);
            break;

          case 'DELIVERED':
            // Notify entity to republish
            for (const op of gr.intermediary.operators) {
              await tx.notification.create({
                data: {
                  recipientOperatorId: op.id,
                  recipientType: 'OPERATOR',
                  title: 'Richiesta beni annullata',
                  message: `Il beneficiario ha annullato la richiesta beni "${gr.title}". Il bene depositato deve essere ripubblicato.`,
                  type: 'GOODS_REQUEST_REJECTED',
                },
              });
            }

            await tx.goodsRequest.update({
              where: { id: gr.id },
              data: { status: 'CANCELLED' },
            });
            out.push(`Richiesta beni "${gr.title}" → CANCELLED + notifica ENTE`);
            break;

          case 'COMPLETED':
          case 'CANCELLED':
            out.push(`Richiesta beni "${gr.title}" → ${gr.status} (invariata)`);
            break;
        }
      }

      // 5. Soft-delete del record User KYKOS (B2: NON più user.delete)
      //    - Preserva lo storico (donazioni, transazioni completate)
      //    - Rende idempotente l'operazione
      //    - Permette di uscire puliti anche se lo step 3 (Supabase) fallisce
      await tx.user.update({
        where: { id: session.id },
        data: {
          deactivatedAt: new Date(),
          deactivatedActions: out,
          // NB: NON azzeriamo authUserId qui. Lo step 3 lo farà se riesce,
          //     altrimenti un cron di cleanup potrà ritentare.
        },
      });

      out.push('Account KYKOS soft-deleted (deactivatedAt valorizzato)');
      return out;
    });

    // ===================================================================
    // Step 2: Supabase Auth deleteUser (FUORI dalla tx) -----------------
    // - Se fallisce dopo i retry, l'utente KYKOS è già soft-deleted e
    //   abbiamo ancora authUserId per ritentare (cron futuro).
    // - Rispondiamo 500 SOLO se TUTTI i retry falliscono, perché a quel
    //   punto è probabile un problema sistemico di Supabase.
    // ===================================================================
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { authUserId: true, email: true },
    });

    let supabaseOk = true;
    if (user?.authUserId) {
      supabaseOk = await deleteSupabaseUserWithRetry(user.authUserId, 3);
      if (supabaseOk) {
        actions.push('Utente Supabase Auth eliminato');
        // Una volta che Supabase ha confermato la cancellazione, l'authUserId
        // non è più un riferimento valido → lo azzeriamo per evitare di
        // ritentare in futuro.
        await prisma.user.update({
          where: { id: session.id },
          data: { authUserId: null },
        });
      } else {
        actions.push('Supabase Auth: eliminazione fallita dopo 3 tentativi (authUserId mantenuto per cron)');
      }
    }

    // Step 3: clear session cookie (sempre, anche in caso di fallimento Supabase)
    await clearSessionCookie();

    if (!supabaseOk) {
      // Lo stato KYKOS è già soft-deleted: il cascade è committed, l'utente
      // non può più fare login perché la sessione è invalidata. Ma
      // avvisiamo il client che l'auth provider ha avuto un problema.
      return NextResponse.json({
        success: false,
        message: 'Account KYKOS disattivato, ma Supabase Auth non ha risposto. Riprova tra qualche minuto.',
        actions,
        supabaseOk: false,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Account disattivato con successo',
      actions,
    });
}, 'POST /api/profile/deactivate');

/**
 * Tenta `supabaseAdmin.auth.admin.deleteUser` con retry e backoff esponenziale.
 * Ritorna `true` se la cancellazione riesce (o se l'utente non esiste già),
 * `false` se tutti i tentativi falliscono.
 *
 * NB: Supabase ritorna errore "user not found" se l'authUserId è già stato
 * cancellato da un tentativo precedente. Trattiamo questo come successo,
 * perché significa che lo stato finale è quello desiderato.
 */
async function deleteSupabaseUserWithRetry(
  authUserId: string,
  maxAttempts: number
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
      if (!error) return true;
      // "user not found" = già cancellato, consideriamo successo idempotente
      if (error.message?.toLowerCase().includes('not found')) return true;
      console.error(
        `Supabase deleteUser attempt ${attempt}/${maxAttempts} failed:`,
        error.message
      );
    } catch (err) {
      console.error(
        `Supabase deleteUser attempt ${attempt}/${maxAttempts} threw:`,
        err
      );
    }
    if (attempt < maxAttempts) {
      // Backoff esponenziale: 200ms, 600ms
      const delay = 200 * Math.pow(3, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return false;
}