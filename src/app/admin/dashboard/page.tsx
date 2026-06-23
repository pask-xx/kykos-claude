'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  AlertTriangle,
  Building2,
  CheckCheck,
  Clock,
  ClipboardList,
  Inbox,
  Package,
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Modal,
  ModalFooter,
  Spinner,
  StatCard,
  Tabs,
} from '@/components/ui';

interface Organization {
  id: string;
  name: string;
  type: string;
  verified: boolean;
  user: {
    email: string;
    createdAt: string;
  };
  _count: {
    objects: number;
    requests: number;
  };
}

interface AdesioneEnte {
  id: string;
  denominazione: string;
  nomeReferente: string;
  cognomeReferente: string;
  telefono: string;
  email: string;
  indirizzo: string;
  civico: string;
  cap: string;
  citta: string;
  provincia: string | null;
  nota: string | null;
  website: string | null;
  status: string;
  emailConfirmed: boolean;
  createdAt: string;
}

const ORG_TYPE_LABELS: Record<string, string> = {
  CHARITY: 'Centro Caritas',
  CHURCH: 'Parrocchia',
  ASSOCIATION: 'Associazione',
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type TabKey = 'enti' | 'adesioni';

/**
 * Mappa Organization.verified → Badge variant KYKOS.
 */
function verifiedBadge(verified: boolean) {
  return verified
    ? { variant: 'success' as const, label: 'Verificato' }
    : { variant: 'warning' as const, label: 'In attesa' };
}

/**
 * Mappa AdesioneEnte.status (+ emailConfirmed) → Badge variant KYKOS.
 */
function adesioneStatusBadge(status: string, emailConfirmed: boolean) {
  if (status === 'PENDING' && !emailConfirmed) {
    return { variant: 'default' as const, label: 'In attesa conferma' };
  }
  switch (status) {
    case 'PENDING': return { variant: 'warning' as const, label: 'In attesa' };
    case 'APPROVED': return { variant: 'success' as const, label: 'Approvata' };
    case 'REJECTED': return { variant: 'danger' as const, label: 'Rifiutata' };
    default: return { variant: 'default' as const, label: status };
  }
}

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>('enti');
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // SWR hooks for automatic polling (30 seconds)
  const { data: intermediariesData, isLoading: intermediariesLoading, mutate: mutateIntermediaries } = useSWR<{ intermediaries: Organization[] }>(
    '/api/admin/intermediaries',
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  const { data: adesioniData, isLoading: adesioniLoading, mutate: mutateAdesioni } = useSWR<{ requests: AdesioneEnte[] }>(
    '/api/adesione',
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  const intermediaries = intermediariesData?.intermediaries || [];
  const adesioni = adesioniData?.requests || [];

  useEffect(() => {
    if (searchParams.get('created') === 'true') {
      toast.success('Ente creato e può ora accedere alla piattaforma');
    } else if (searchParams.get('verified') === 'true') {
      toast.success('Ente verificato con successo');
    }
  }, [searchParams]);

  const verifiedCount = intermediaries.filter((i) => i.verified).length;
  const pendingCount = intermediaries.filter((i) => !i.verified).length;
  const pendingAdesioni = adesioni.filter((a) => a.status === 'PENDING').length;

  const handleAdesioneAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/adesione/${confirmAction.id}?action=${confirmAction.action}`, { method: 'PATCH' });
      if (res.ok) {
        // Revalidate both data sources
        mutateAdesioni();
        mutateIntermediaries();

        if (confirmAction.action === 'approve') {
          // Redirect to ente creation page
          window.location.href = `/admin/intermediaries/new?from=adesione&enteId=${confirmAction.id}`;
        } else {
          setConfirmAction(null);
          toast.success('Operazione completata con successo');
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data?.error || 'Errore durante l\'operazione');
      }
    } catch (err) {
      console.error('Error:', err);
      setActionError('Errore di connessione');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={CheckCheck} label="Enti verificati" value={verifiedCount} tone="success" />
        <StatCard icon={Clock} label="Enti da verificare" value={pendingCount} tone="warning" />
        <StatCard
          icon={ClipboardList}
          label="Richieste adesione"
          value={pendingAdesioni}
          tone="info"
          onClick={() => setActiveTab('adesioni')}
        />
        <StatCard icon={Building2} label="Totale enti" value={intermediaries.length} tone="primary" />
      </div>

      <Tabs<TabKey>
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { value: 'enti', label: 'Gestione Enti', count: intermediaries.length },
          { value: 'adesioni', label: 'Richieste Adesione', count: pendingAdesioni },
        ]}
        variant="default"
        ariaLabel="Tab amministrazione"
      />

      {activeTab === 'enti' ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Gestione Enti</h2>

          {intermediariesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : intermediaries.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Nessun ente registrato"
              description="Non ci sono enti che hanno completato la registrazione."
            />
          ) : (
            <div className="space-y-4">
              {intermediaries.map((org) => {
                const statusBadge = verifiedBadge(org.verified);
                return (
                  <Link
                    key={org.id}
                    href={`/admin/intermediaries/${org.id}`}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900">{org.name}</h3>
                        <Badge variant={statusBadge.variant} size="sm">
                          {statusBadge.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {ORG_TYPE_LABELS[org.type] || org.type} • {org.user.email}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Registrato il {new Date(org.user.createdAt).toLocaleDateString('it-IT')}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Package className="h-3.5 w-3.5" aria-hidden="true" />
                          {org._count.objects} oggetti
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                          {org._count.requests} richieste
                        </span>
                      </div>
                    </div>
                    {!org.verified && (
                      <form
                        action={`/api/admin/intermediaries/${org.id}/verify`}
                        method="POST"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          type="submit"
                          variant="success"
                          size="sm"
                        >
                          Approva
                        </Button>
                      </form>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Richieste di Adesione</h2>

          {adesioniLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : adesioni.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Nessuna richiesta di adesione"
              description="Non ci sono richieste di adesione da gestire al momento."
            />
          ) : (
            <div className="space-y-4">
              {adesioni.map((adesione) => {
                const statusBadge = adesioneStatusBadge(adesione.status, adesione.emailConfirmed);
                const isPendingNotConfirmed = adesione.status === 'PENDING' && !adesione.emailConfirmed;
                return (
                  <div
                    key={adesione.id}
                    className={`p-4 rounded-lg border ${
                      isPendingNotConfirmed
                        ? 'bg-gray-50 border-gray-200'
                        : adesione.status === 'PENDING'
                          ? 'bg-warning-50 border-warning-200'
                          : adesione.status === 'APPROVED'
                            ? 'bg-success-50 border-success-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{adesione.denominazione}</h3>
                          <Badge variant={statusBadge.variant} size="sm">
                            {statusBadge.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Referente:</strong> {adesione.nomeReferente} {adesione.cognomeReferente}</p>
                          <p><strong>Email:</strong> {adesione.email}</p>
                          <p><strong>Telefono:</strong> {adesione.telefono}</p>
                          <p><strong>Indirizzo:</strong> {adesione.indirizzo}, {adesione.civico} - {adesione.cap} {adesione.citta}</p>
                          {adesione.website && <p><strong>Sito web:</strong> {adesione.website}</p>}
                          {adesione.nota && <p><strong>Nota:</strong> {adesione.nota}</p>}
                          {isPendingNotConfirmed && (
                            <Alert type="warning" className="mt-2">
                              <AlertTriangle className="h-4 w-4 inline mr-1" aria-hidden="true" />
                              <strong>Email non confermata</strong> - L&apos;ente deve cliccare il link nella email ricevuta
                            </Alert>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Richiesta del {new Date(adesione.createdAt).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      {adesione.status === 'PENDING' && adesione.emailConfirmed && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => { setConfirmAction({ id: adesione.id, action: 'approve' }); setActionError(null); }}
                          >
                            Approva
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => { setConfirmAction({ id: adesione.id, action: 'reject' }); setActionError(null); }}
                          >
                            Rifiuta
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => { setConfirmAction(null); setActionError(null); }}
        title={`Conferma ${confirmAction?.action === 'approve' ? 'approvazione' : 'rifiuto'}`}
        closeOnEsc
      >
        <p className="text-gray-600 mb-4">
          Sei sicuro di voler {confirmAction?.action === 'approve' ? 'approvare' : 'rifiutare'} questa richiesta di adesione?
        </p>
        {actionError && (
          <Alert type="error" className="mb-4">
            {actionError}
          </Alert>
        )}
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => { setConfirmAction(null); setActionError(null); }}
            disabled={actionLoading}
          >
            Annulla
          </Button>
          <Button
            variant={confirmAction?.action === 'approve' ? 'success' : 'danger'}
            onClick={handleAdesioneAction}
            disabled={actionLoading}
            loading={actionLoading}
          >
            Conferma
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner size="lg" />
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pannello Amministratore</h1>
      <Suspense fallback={<LoadingFallback />}>
        <AdminDashboardContent />
      </Suspense>
    </div>
  );
}
