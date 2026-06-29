import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  Inbox,
  Package,
  AlertTriangle,
  UserCheck,
  HandHeart,
  Truck,
  Archive,
  Gift,
  Users,
  Heart,
  Calendar,
  Box,
  ScanLine,
  HandCoins,
  ListChecks,
  Bell,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireOperator } from '@/lib/operator-session';
import { hasPermission } from '@/lib/permissions';
import {
  StatCard,
  EntityListCard,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  EmptyState,
  Badge,
  SectionDivider,
} from '@/components/ui';
import { formatDate } from '@/lib/utils';
import {
  REQUEST_STATUS_LABELS,
  GOODS_OFFER_STATUS_LABELS,
  OBJECT_STATUS_LABELS,
} from '@/types';
import type {
  RequestStatus,
  GoodsOfferStatus,
  OperatorPermission,
} from '@/types';
import type {
  ReportStatus,
  VolunteerStatus,
  MultiAvailabilityRequestStatus,
} from '@prisma/client';

// Label locali per status non esportati da src/types (VolunteerStatus,
// ReportStatus, MultiAvailabilityRequestStatus). KYKOS rule: enum NON
// mai mostrati raw (vedi 01-core-principles.md).
const VOLUNTEER_STATUS_LABELS: Record<VolunteerStatus, string> = {
  PENDING: 'In attesa',
  APPROVED: 'Approvato',
  REJECTED: 'Rifiutato',
  SUSPENDED: 'Sospeso',
  WITHDRAWN: 'Ritirato',
};

const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: 'In attesa',
  REVIEWED: 'In revisione',
  RESOLVED: 'Risolta',
  DISMISSED: 'Archiviata',
};

const MULTI_AVAILABILITY_REQUEST_STATUS_LABELS: Record<MultiAvailabilityRequestStatus, string> = {
  PENDING: 'In attesa',
  ASSIGNED: 'Assegnata',
  FULFILLED: 'Evasa',
  REJECTED: 'Rifiutata',
  CANCELLED: 'Annullata',
};

/**
 * <OperatorDashboard> — cockpit personalizzato per ruolo.
 *
 * La dashboard mostra sezioni diverse in base a:
 * 1. **Flag operatore** (`isOfficeOperator` vs `isStreetOperator`)
 * 2. **Permessi granulari** (`RECIPIENT_AUTHORIZE`, `OBJECT_RECEIVE`, ...)
 * 3. **Ruolo** (`ADMIN` vede tutto, `OPERATORE` vede subset)
 *
 * **Sezioni office (cockpit completo)**:
 * 1. "Da fare oggi" — code operative prioritarie (richieste, offerte, multi-avail, segnalazioni, volontari)
 * 2. "Stato logistico" — oggetti per stato + distribuzioni aperte
 * 3. "Anagrafica & sistema" — beneficiari, donatori, operatori
 * 4. "Cause attive" — raccolte fondi/servizi attive
 * 5. "Da fare" — top 5 richieste/multi-availability pendenti più vecchie
 *
 * **Sezioni street (scope ridotto)**: solo 4 contatori minimi per il
 * workflow di strada (consegne, beneficiari street-managed, diocese
 * objects, scansione QR). Niente sezione "Da fare" (gestita dalla
 * campanella QR).
 *
 * **Performance**: 18 query Prisma in Promise.all (15 count + 2 findMany
 * take 5 + 1 sempre operatorCount). Server component puro, niente polling.
 * Stima < 200ms totale.
 *
 * **Privacy**: l'operatore è già autenticato a livello intermediario,
 * quindi può vedere nomi/nickname dei beneficiari per ragioni logistiche.
 * Le sezioni "Da fare" mostrano SOLO nickname (mai nome reale se c'è
 * nickname), email e telefono sono MAI esposti.
 */
export default async function OperatorDashboard() {
  const { operator } = await requireOperator();

  // requireOperator() NON fa include di organization: la carico
  // separatamente per evitare di modificare la firma del helper.
  const organization = await prisma.organization.findUnique({
    where: { id: operator.organizationId },
    select: { id: true, name: true, dioceseId: true },
  });

  if (!organization) {
    redirect('/operator/login');
  }

  const orgId = operator.organizationId;
  const role = operator.role;
  const permissions = operator.permissions;
  const isOffice = operator.isOfficeOperator;
  const isStreet = operator.isStreetOperator;

  // Helper: true se l'operatore ha il permesso richiesto
  // (controlla sia role default permissions che override espliciti)
  const can = (perm: OperatorPermission): boolean =>
    hasPermission(role, permissions, perm);

  // ====== Sezione street: scope ridotto ======
  if (isStreet && !isOffice) {
    const [
      streetDeliverCount,
      streetBeneficiaryCount,
      dioceseObjectCount,
    ] = await Promise.all([
      // Richieste di beneficiari street-managed in attesa di consegna
      prisma.request.count({
        where: {
          intermediaryId: orgId,
          status: 'APPROVED' as RequestStatus,
          recipient: { isStreetManaged: true },
        },
      }),
      // Beneficiari gestiti da questo operatore street
      prisma.streetOperatorBeneficiary.count({
        where: { streetOperatorId: operator.id },
      }),
      // Oggetti disponibili della diocesi di appartenenza
      organization.dioceseId
        ? prisma.object.count({
            where: {
              intermediary: { dioceseId: organization.dioceseId },
              status: 'AVAILABLE',
            },
          })
        : Promise.resolve(0),
    ]);

    return (
      <div className="space-y-6">
        {/* Header street */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Ciao, {operator.firstName} {operator.lastName}
            </h1>
            <p className="text-gray-500">{organization.name}</p>
          </div>
          <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium">
            Operatore di strada
          </span>
        </div>

        <SectionDivider label="Attività di strada" count={streetDeliverCount + streetBeneficiaryCount + dioceseObjectCount} color="info" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Truck className="w-6 h-6 text-warning-600" aria-hidden="true" />}
            label="Consegne da effettuare"
            value={streetDeliverCount}
            tone="warning"
            href="/operator/requests-entity?status=APPROVED&streetManaged=true"
            sublabel={streetDeliverCount > 0 ? 'Beneficiari street-managed' : undefined}
          />
          <StatCard
            icon={<HandHeart className="w-6 h-6 text-primary-600" aria-hidden="true" />}
            label="Beneficiari seguiti"
            value={streetBeneficiaryCount}
            tone="primary"
            href="/operator/recipients?streetManaged=true"
          />
          <StatCard
            icon={<Package className="w-6 h-6 text-info-600" aria-hidden="true" />}
            label="Oggetti diocesi"
            value={dioceseObjectCount}
            tone="info"
            href="/operator/diocese-objects"
          />
          <StatCard
            icon={<ScanLine className="w-6 h-6 text-success-600" aria-hidden="true" />}
            label="Scansiona QR"
            value="→"
            tone="success"
            href="/operator/scan"
            ariaLabel="Vai alla pagina di scansione QR"
          />
        </div>
      </div>
    );
  }

  // ====== Sezione office: cockpit completo ======
  // Esegui tutte le 18 query in parallelo (Promise.all).
  // Le query condizionali da `can()` ritornano 0/[] se l'operatore
  // non ha il permesso: pattern early-return con conditional.
  const [
    pendingRequestCount,
    pendingOfferCount,
    pendingMultiAvailCount,
    pendingReportCount,
    pendingVolunteerCount,
    depositedObjectCount,
    reservedObjectCount,
    availableObjectCount,
    openDistributionCount,
    blockedObjectCount,
    authorizedRecipientCount,
    unconfirmedRecipientCount,
    donorCount,
    operatorCount,
    activeCauseCount,
    top5Requests,
    top5MultiAvail,
  ] = await Promise.all([
    // SEZIONE 1: "Da fare oggi"
    can('RECIPIENT_AUTHORIZE')
      ? prisma.request.count({
          where: { intermediaryId: orgId, status: 'PENDING' },
        })
      : 0,
    can('RECIPIENT_AUTHORIZE')
      ? prisma.goodsOffer.count({
          where: {
            request: { intermediaryId: orgId },
            status: 'PENDING' as GoodsOfferStatus,
          },
        })
      : 0,
    can('ORGANIZATION_ADMIN')
      ? prisma.multiAvailabilityRequest.count({
          where: {
            multiAvailability: { organizationId: orgId },
            status: 'PENDING' as MultiAvailabilityRequestStatus,
          },
        })
      : 0,
    can('RECIPIENT_AUTHORIZE')
      ? prisma.report.count({
          where: {
            object: { intermediaryId: orgId },
            status: 'PENDING' as ReportStatus,
          },
        })
      : 0,
    can('VOLUNTEER_MANAGE')
      ? prisma.volunteerAssociation.count({
          where: {
            organizationId: orgId,
            status: 'PENDING' as VolunteerStatus,
          },
        })
      : 0,

    // SEZIONE 2: "Stato logistico"
    can('OBJECT_RECEIVE')
      ? prisma.object.count({ where: { intermediaryId: orgId, status: 'DEPOSITED' } })
      : 0,
    can('OBJECT_RECEIVE')
      ? prisma.object.count({ where: { intermediaryId: orgId, status: 'RESERVED' } })
      : 0,
    can('OBJECT_RECEIVE')
      ? prisma.object.count({ where: { intermediaryId: orgId, status: 'AVAILABLE' } })
      : 0,
    can('ORGANIZATION_ADMIN')
      ? prisma.multiAvailability.count({
          where: { organizationId: orgId, status: 'OPEN' },
        })
      : 0,
    can('OBJECT_RECEIVE')
      ? prisma.object.count({ where: { intermediaryId: orgId, status: 'BLOCKED' } })
      : 0,

    // SEZIONE 3: "Anagrafica & sistema"
    can('RECIPIENT_AUTHORIZE')
      ? prisma.user.count({
          where: {
            referenceEntityId: orgId,
            authorized: true,
            deactivatedAt: null,
          },
        })
      : 0,
    can('RECIPIENT_AUTHORIZE')
      ? prisma.user.count({
          where: {
            referenceEntityId: orgId,
            authorized: true,
            emailConfirmed: false,
            deactivatedAt: null,
          },
        })
      : 0,
    can('RECIPIENT_AUTHORIZE')
      ? prisma.user.count({
          where: {
            donatedObjects: { some: { intermediaryId: orgId } },
            role: 'DONOR',
          },
        })
      : 0,

    // Operator count: sempre visibile
    prisma.operator.count({ where: { organizationId: orgId, active: true } }),

    // SEZIONE 4: "Cause attive"
    can('ORGANIZATION_ADMIN')
      ? prisma.cause.count({
          where: {
            organizationId: orgId,
            OR: [{ deadline: null }, { deadline: { gt: new Date() } }],
          },
        })
      : 0,

    // SEZIONE 5: "Da fare" — top 5
    can('RECIPIENT_AUTHORIZE')
      ? prisma.request.findMany({
          where: { intermediaryId: orgId, status: 'PENDING' as RequestStatus },
          orderBy: { createdAt: 'asc' },
          take: 5,
          include: {
            object: { select: { title: true, category: true } },
            recipient: { select: { nickname: true, name: true } },
          },
        })
      : [],
    can('ORGANIZATION_ADMIN')
      ? prisma.multiAvailabilityRequest.findMany({
          where: {
            multiAvailability: { organizationId: orgId },
            status: 'PENDING' as MultiAvailabilityRequestStatus,
          },
          orderBy: { requestedAt: 'asc' },
          take: 5,
          include: {
            multiAvailability: { select: { title: true, category: true } },
            beneficiary: { select: { nickname: true, name: true } },
          },
        })
      : [],
  ]);

  // Calcola totali sezioni per header (mostra solo se > 0)
  const sezione1Totale =
    pendingRequestCount +
    pendingOfferCount +
    pendingMultiAvailCount +
    pendingReportCount +
    pendingVolunteerCount;
  const sezione2Totale =
    depositedObjectCount +
    reservedObjectCount +
    availableObjectCount +
    openDistributionCount +
    blockedObjectCount;
  const sezione5Totale = top5Requests.length + top5MultiAvail.length;

  // Helper: formatta label status in italiano
  const statusLabel = (
    status: RequestStatus | GoodsOfferStatus | MultiAvailabilityRequestStatus | ReportStatus | VolunteerStatus,
  ): string => {
    if (status === 'PENDING') return REQUEST_STATUS_LABELS.PENDING;
    if (status in VOLUNTEER_STATUS_LABELS) return VOLUNTEER_STATUS_LABELS[status as VolunteerStatus];
    if (status in GOODS_OFFER_STATUS_LABELS) return GOODS_OFFER_STATUS_LABELS[status as GoodsOfferStatus];
    if (status in REPORT_STATUS_LABELS) return REPORT_STATUS_LABELS[status as ReportStatus];
    if (status in MULTI_AVAILABILITY_REQUEST_STATUS_LABELS) {
      return MULTI_AVAILABILITY_REQUEST_STATUS_LABELS[status as MultiAvailabilityRequestStatus];
    }
    if (status in OBJECT_STATUS_LABELS) return OBJECT_STATUS_LABELS[status as keyof typeof OBJECT_STATUS_LABELS];
    return status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ciao, {operator.firstName} {operator.lastName}
          </h1>
          <p className="text-gray-500">{organization.name}</p>
        </div>
        <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium">
          {operator.role}
        </span>
      </div>

      {/* === SEZIONE 1: "Da fare oggi" === */}
      <SectionDivider label="Da fare oggi" count={sezione1Totale} color="warning" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {can('RECIPIENT_AUTHORIZE') && (
          <StatCard
            icon={<Inbox className="w-6 h-6 text-warning-600" aria-hidden="true" />}
            label="Richieste oggetto"
            value={pendingRequestCount}
            tone="warning"
            href="/operator/requests-entity?status=PENDING"
            sublabel={pendingRequestCount > 0 ? 'In attesa di autorizzazione' : undefined}
          />
        )}
        {can('RECIPIENT_AUTHORIZE') && (
          <StatCard
            icon={<HandHeart className="w-6 h-6 text-primary-600" aria-hidden="true" />}
            label="Offerte beni"
            value={pendingOfferCount}
            tone="primary"
            href="/operator/goods-requests?status=PENDING"
            sublabel={pendingOfferCount > 0 ? 'Da valutare' : undefined}
          />
        )}
        {can('ORGANIZATION_ADMIN') && (
          <StatCard
            icon={<ListChecks className="w-6 h-6 text-info-600" aria-hidden="true" />}
            label="Multi-availability"
            value={pendingMultiAvailCount}
            tone="info"
            href="/operator/availability?status=PENDING"
            sublabel={pendingMultiAvailCount > 0 ? 'Richieste pendenti' : undefined}
          />
        )}
        {can('RECIPIENT_AUTHORIZE') && (
          <StatCard
            icon={<AlertTriangle className="w-6 h-6 text-error-600" aria-hidden="true" />}
            label="Segnalazioni"
            value={pendingReportCount}
            tone="danger"
            href="/operator/reports?status=PENDING"
            sublabel={pendingReportCount > 0 ? 'Da revisionare' : undefined}
          />
        )}
        {can('VOLUNTEER_MANAGE') && (
          <StatCard
            icon={<Bell className="w-6 h-6 text-secondary-600" aria-hidden="true" />}
            label="Volontari"
            value={pendingVolunteerCount}
            tone="secondary"
            href="/operator/volunteers?status=PENDING"
            sublabel={pendingVolunteerCount > 0 ? 'Candidature da valutare' : undefined}
          />
        )}
      </div>

      {/* === SEZIONE 2: "Stato logistico" === */}
      {can('OBJECT_RECEIVE') && (
        <>
          <SectionDivider label="Stato logistico" count={sezione2Totale} color="info" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Archive className="w-6 h-6 text-primary-600" aria-hidden="true" />}
              label="Depositati"
              value={depositedObjectCount}
              tone="primary"
              href="/operator/objects?status=DEPOSITED"
            />
            <StatCard
              icon={<Package className="w-6 h-6 text-warning-600" aria-hidden="true" />}
              label="Prenotati"
              value={reservedObjectCount}
              tone="warning"
              href="/operator/objects?status=RESERVED"
            />
            <StatCard
              icon={<Gift className="w-6 h-6 text-success-600" aria-hidden="true" />}
              label="Disponibili"
              value={availableObjectCount}
              tone="success"
              href="/operator/objects?status=AVAILABLE"
            />
            {can('ORGANIZATION_ADMIN') && (
              <StatCard
                icon={<Truck className="w-6 h-6 text-info-600" aria-hidden="true" />}
                label="Distribuzioni aperte"
                value={openDistributionCount}
                tone="info"
                href="/operator/availability?status=OPEN"
              />
            )}
            {blockedObjectCount > 0 && (
              <StatCard
                icon={<AlertTriangle className="w-6 h-6 text-error-600" aria-hidden="true" />}
                label="Bloccati"
                value={blockedObjectCount}
                tone="danger"
                href="/operator/objects?status=BLOCKED"
                sublabel="Richiedono attenzione"
              />
            )}
          </div>
        </>
      )}

      {/* === SEZIONE 3: "Anagrafica & sistema" === */}
      <SectionDivider label="Anagrafica & sistema" count={authorizedRecipientCount + donorCount + operatorCount} color="success" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {can('RECIPIENT_AUTHORIZE') && (
          <StatCard
            icon={<UserCheck className="w-6 h-6 text-success-600" aria-hidden="true" />}
            label="Beneficiari autorizzati"
            value={authorizedRecipientCount}
            tone="success"
            href="/operator/recipients?authorized=true"
          />
        )}
        {can('RECIPIENT_AUTHORIZE') && (
          <StatCard
            icon={<Clock className="w-6 h-6 text-warning-600" aria-hidden="true" />}
            label="Da sollecitare"
            value={unconfirmedRecipientCount}
            tone="warning"
            href="/operator/recipients?authorized=true&emailConfirmed=false"
            sublabel={unconfirmedRecipientCount > 0 ? 'Email non confermata' : undefined}
          />
        )}
        {can('RECIPIENT_AUTHORIZE') && (
          <StatCard
            icon={<Heart className="w-6 h-6 text-primary-600" aria-hidden="true" />}
            label="Donatori totali"
            value={donorCount}
            tone="primary"
            href="/operator/donors"
          />
        )}
        <StatCard
          icon={<Users className="w-6 h-6 text-secondary-600" aria-hidden="true" />}
          label="Operatori ente"
          value={operatorCount}
          tone="secondary"
          href="/operator/team"
        />
      </div>

      {/* === SEZIONE 4: "Cause attive" === */}
      {can('ORGANIZATION_ADMIN') && (
        <>
          <SectionDivider label="Cause attive" count={activeCauseCount} color="primary" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              icon={<Calendar className="w-6 h-6 text-info-600" aria-hidden="true" />}
              label="Cause attive"
              value={activeCauseCount}
              tone="info"
              href="/operator/causes"
            />
            <StatCard
              icon={<HandCoins className="w-6 h-6 text-success-600" aria-hidden="true" />}
              label="Raccolta fondi"
              value={activeCauseCount > 0 ? 'Vai →' : '—'}
              tone="success"
              href="/operator/causes"
            />
          </div>
        </>
      )}

      {/* === SEZIONE 5: "Da fare" — top 5 === */}
      {sezione5Totale > 0 && (
        <>
          <SectionDivider label="Da fare" count={sezione5Totale} color="warning" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 richieste */}
            {can('RECIPIENT_AUTHORIZE') && top5Requests.length > 0 && (
              <Card variant="bordered" padding="md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Richieste in attesa da più tempo</CardTitle>
                    <Link
                      href="/operator/requests-entity?status=PENDING"
                      className="text-sm text-primary-600 hover:underline"
                    >
                      Vedi tutte →
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {top5Requests.map((req) => {
                      const recipientName = req.recipient.nickname || req.recipient.name;
                      return (
                        <EntityListCard
                          key={req.id}
                          icon={<Box className="w-6 h-6 text-primary-600" aria-hidden="true" />}
                          title={req.object?.title ?? '(oggetto rimosso)'}
                          badgesTop={
                            <Badge variant="warning" size="sm">
                              {statusLabel(req.status)}
                            </Badge>
                          }
                          meta={`${recipientName} • ${formatDate(req.createdAt)}`}
                          href={`/operator/requests/${req.id}`}
                          ariaLabel={`Richiesta ${req.object?.title ?? 'rimossa'} da ${recipientName}`}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top 5 multi-availability */}
            {can('ORGANIZATION_ADMIN') && top5MultiAvail.length > 0 && (
              <Card variant="bordered" padding="md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Multi-availability in attesa</CardTitle>
                    <Link
                      href="/operator/availability?status=PENDING"
                      className="text-sm text-primary-600 hover:underline"
                    >
                      Vedi tutte →
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {top5MultiAvail.map((mar) => {
                      const beneficiaryName = mar.beneficiary.nickname || mar.beneficiary.name;
                      return (
                        <EntityListCard
                          key={mar.id}
                          icon={<Package className="w-6 h-6 text-info-600" aria-hidden="true" />}
                          title={mar.multiAvailability.title}
                          badgesTop={
                            <Badge variant="warning" size="sm">
                              {statusLabel(mar.status)}
                            </Badge>
                          }
                          meta={`${beneficiaryName} • ${formatDate(mar.requestedAt)}`}
                          href={`/operator/availability/${mar.multiAvailabilityId}`}
                          ariaLabel={`Richiesta multi-availability ${mar.multiAvailability.title} da ${beneficiaryName}`}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Empty state se nessuna sezione ha contenuto */}
      {sezione1Totale === 0 &&
        sezione2Totale === 0 &&
        authorizedRecipientCount === 0 &&
        donorCount === 0 &&
        !can('OBJECT_RECEIVE') &&
        !can('VOLUNTEER_MANAGE') &&
        !can('ORGANIZATION_ADMIN') && (
          <Card variant="bordered" padding="lg">
            <EmptyState
              icon={<Inbox className="mx-auto h-12 w-12 text-primary-300 mb-4" aria-hidden="true" />}
              title="Nessuna sezione disponibile per il tuo ruolo"
              description="Contatta l'amministratore del tuo ente se pensi che manchino dei permessi."
            />
          </Card>
        )}
    </div>
  );
}
