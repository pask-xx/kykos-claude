import { NextResponse } from 'next/server';
import { getSession, clearSessionCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';
import { ObjectStatus, GoodsOfferStatus, GoodsRequestStatus } from '@prisma/client';

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

export async function GET() {
  try {
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
      let willBe = 'CANCELLED';

      switch (obj.status) {
        case 'AVAILABLE':
          willBe = 'CANCELLED';
          break;
        case 'RESERVED':
          willBe = 'CANCELLED';
          break;
        case 'DEPOSITED':
          willBe = 'DEPOSITED (cannot change)';
          preview.blockingReasons.push(
            `L'oggetto "${obj.title}" è già depositato presso l'ente e non può essere cancellato`
          );
          preview.canDeactivate = false;
          break;
        case 'DONATED':
          willBe = 'DONATED (unchanged - completed)';
          break;
        case 'CANCELLED':
          willBe = 'CANCELLED (unchanged)';
          break;
        case 'BLOCKED':
          willBe = 'BLOCKED (unchanged)';
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
      let willBe = 'CANCELLED';

      switch (offer.status) {
        case 'PENDING':
          willBe = 'CANCELLED';
          break;
        case 'ACCEPTED':
          willBe = 'CANCELLED + notifica beneficiario';
          break;
        case 'REJECTED':
          willBe = 'REJECTED (unchanged)';
          break;
        case 'CANCELLED':
          willBe = 'CANCELLED (unchanged)';
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
      let willBe = 'CANCELLED';

      switch (req.object.status) {
        case 'AVAILABLE':
        case 'RESERVED':
          willBe = 'CANCELLED, oggetto torna disponibile';
          break;
        case 'DEPOSITED':
          willBe = 'CANCELLED + notifica ENTE';
          // Notify entity operators
          preview.blockingReasons.push(
            `La richiesta per "${req.object.title}" sarà cancellata ma l'ente dovrà ripubblicare l'oggetto`
          );
          break;
        case 'DONATED':
          willBe = 'DONATED (cannot cancel - already completed)';
          preview.blockingReasons.push(
            `La richiesta per "${req.object.title}" non può essere cancellata (già ritirata)`
          );
          preview.canDeactivate = false;
          break;
        case 'CANCELLED':
        case 'BLOCKED':
          willBe = `${req.object.status} (unchanged)`;
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
      let willBe = 'CANCELLED';
      let shouldBlock = false;

      switch (gr.status) {
        case 'PENDING':
          willBe = 'CANCELLED';
          break;
        case 'APPROVED':
          willBe = 'CANCELLED + offerte cancellate';
          break;
        case 'FULFILLED':
          willBe = 'CANCELLED + notifica DONATORE';
          // Notify the donor who fulfilled this request
          break;
        case 'DELIVERED':
          willBe = 'CANCELLED + notifica ENTE';
          // Notify entity to republish
          break;
        case 'COMPLETED':
          willBe = 'COMPLETED (cannot cancel - already completed)';
          preview.blockingReasons.push(
            `La richiesta beni "${gr.title}" non può essere cancellata (già completata)`
          );
          preview.canDeactivate = false;
          shouldBlock = true;
          break;
        case 'CANCELLED':
          willBe = 'CANCELLED (unchanged)';
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
  } catch (error) {
    console.error('Deactivation preview error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      const actions: string[] = [];

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
            actions.push(`Oggetto "${obj.title}" → CANCELLED`);
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
            actions.push(`Oggetto "${obj.title}" → CANCELLED (Request annullata)`);
            break;

          case 'DEPOSITED':
          case 'DONATED':
          case 'CANCELLED':
          case 'BLOCKED':
            actions.push(`Oggetto "${obj.title}" → ${obj.status} (invariato)`);
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
            actions.push(`Offerta per "${offer.request.title}" → CANCELLED`);
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

            actions.push(`Offerta per "${offer.request.title}" → CANCELLED + richiesta torna APPROVATA`);
            break;

          case 'REJECTED':
          case 'CANCELLED':
            actions.push(`Offerta per "${offer.request.title}" → ${offer.status} (invariata)`);
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

            actions.push(`Richiesta per "${req.object.title}" → CANCELLED, oggetto torna disponibile`);
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

            actions.push(`Richiesta per "${req.object.title}" → CANCELLED + notifica ENTE`);
            break;

          case 'DONATED':
            actions.push(`Richiesta per "${req.object.title}" → DONATED (invariata - già completata)`);
            break;

          case 'CANCELLED':
          case 'BLOCKED':
            actions.push(`Richiesta per "${req.object.title}" → ${req.object.status} (invariata)`);
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
            actions.push(`Richiesta beni "${gr.title}" → CANCELLED`);
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
            actions.push(`Richiesta beni "${gr.title}" → CANCELLED + ${gr.offers.length} offerte cancellate`);
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
            actions.push(`Richiesta beni "${gr.title}" → CANCELLED + notifica DONATORE`);
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
            actions.push(`Richiesta beni "${gr.title}" → CANCELLED + notifica ENTE`);
            break;

          case 'COMPLETED':
          case 'CANCELLED':
            actions.push(`Richiesta beni "${gr.title}" → ${gr.status} (invariata)`);
            break;
        }
      }

      // 5. Delete from Supabase Auth (if authUserId exists)
      const user = await tx.user.findUnique({
        where: { id: session.id },
        select: { authUserId: true, email: true },
      });

      if (user?.authUserId) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(user.authUserId);
          actions.push('Utente Supabase Auth eliminato');
        } catch (supabaseError) {
          console.error('Supabase Auth deletion error:', supabaseError);
          actions.push('Supabase Auth: eliminazione saltata');
        }
      }

      // 6. Delete the KYKOS user record
      await tx.user.delete({
        where: { id: session.id },
      });

      actions.push('Account KYKOS eliminato');

      return actions;
    });

    // Clear session cookie
    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: 'Account disattivato con successo',
      actions: result,
    });
  } catch (error) {
    console.error('Deactivation error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}