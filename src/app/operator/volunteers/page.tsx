'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  HandHeart,
  Handshake,
  MessageSquare,
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
} from '@/components/ui';

interface Volunteer {
  id: string;
  userId: string;
  skills: string[];
  note: string | null;
  cvUrl: string | null;
  status: string;
  startDate: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    city: string | null;
  };
}

type ActionType = 'approve' | 'reject' | 'suspend';

const ACTION_TITLE: Record<ActionType, string> = {
  approve: 'Conferma approvazione',
  reject: 'Conferma rifiuto',
  suspend: 'Conferma sospensione',
};

const ACTION_BUTTON_VARIANT: Record<ActionType, 'success' | 'danger' | 'secondary'> = {
  approve: 'success',
  reject: 'danger',
  suspend: 'secondary',
};

const ACTION_SUCCESS_MESSAGE: Record<ActionType, string> = {
  approve: 'Volontario approvato',
  reject: 'Candidatura rifiutata',
  suspend: 'Volontario sospeso',
};

export default function OperatorVolunteersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Volunteer[]>([]);
  const [approved, setApproved] = useState<Volunteer[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ volunteer: Volunteer; action: ActionType } | null>(null);

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    try {
      const res = await fetch('/api/operator/volunteers');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || 'Errore nel caricamento');
        return;
      }
      const data = await res.json();
      setPending(data.pending || []);
      setApproved(data.approved || []);
    } catch {
      setError('Errore di connessione');
      toast.error('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (volunteerId: string, action: ActionType) => {
    setActionLoading(volunteerId);
    setError(null);

    try {
      const res = await fetch(`/api/operator/volunteers/${volunteerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        // Refresh lists
        if (action === 'approve') {
          const volunteer = pending.find((v) => v.id === volunteerId);
          setPending((prev) => prev.filter((v) => v.id !== volunteerId));
          if (volunteer) {
            setApproved((prev) => [
              {
                ...volunteer,
                status: 'APPROVED',
                startDate: new Date().toISOString(),
              },
              ...prev,
            ]);
          }
        } else if (action === 'reject') {
          setPending((prev) => prev.filter((v) => v.id !== volunteerId));
        } else if (action === 'suspend') {
          setApproved((prev) => prev.filter((v) => v.id !== volunteerId));
        }
        toast.success(ACTION_SUCCESS_MESSAGE[action]);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || 'Errore durante l\'azione');
        toast.error(data?.error || 'Errore durante l\'azione');
      }
    } catch {
      setError('Errore di connessione');
      toast.error('Errore di connessione');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/operator/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
            Torna alla dashboard
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
          <Handshake className="h-6 w-6 text-primary-600" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Volontari</h1>
          <p className="text-gray-600">Revisiona e gestisci le candidature dei volontari</p>
        </div>
      </div>

      {error && (
        <Alert type="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction ? ACTION_TITLE[confirmAction.action] : ''}
        closeOnEsc
      >
        {confirmAction && (
          <>
            <p className="text-gray-600 mb-4">
              {confirmAction.action === 'approve' && (
                <>Vuoi davvero approvare la candidatura di <strong>{confirmAction.volunteer.user.name}</strong> come volontario?</>
              )}
              {confirmAction.action === 'reject' && (
                <>Vuoi davvero rifiutare la candidatura di <strong>{confirmAction.volunteer.user.name}</strong>?</>
              )}
              {confirmAction.action === 'suspend' && (
                <>Vuoi davvero sospendere <strong>{confirmAction.volunteer.user.name}</strong> dall&apos;attività di volontario?</>
              )}
            </p>
            <ModalFooter>
              <Button
                variant="secondary"
                onClick={() => setConfirmAction(null)}
                disabled={!!actionLoading}
              >
                Annulla
              </Button>
              <Button
                variant={ACTION_BUTTON_VARIANT[confirmAction.action]}
                onClick={() => {
                  const { volunteer, action } = confirmAction;
                  setConfirmAction(null);
                  handleAction(volunteer.id, action);
                }}
                loading={actionLoading === confirmAction.volunteer.id}
              >
                Conferma
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* Pending Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Candidature pendenti</h2>
          {pending.length > 0 && (
            <Badge variant="warning" size="sm">
              {pending.length}
            </Badge>
          )}
        </div>

        {pending.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Nessuna candidatura pendente"
            description="Tutte le candidature sono state revisionate."
          />
        ) : (
          <div className="space-y-4">
            {pending.map((volunteer) => (
              <div key={volunteer.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <button
                      onClick={() => router.push(`/operator/recipients/${volunteer.user.id}`)}
                      className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      {volunteer.user.name} →
                    </button>
                    <p className="text-sm text-gray-500">{volunteer.user.email}</p>
                    {volunteer.user.city && (
                      <p className="text-sm text-gray-400">{volunteer.user.city}</p>
                    )}
                    {volunteer.skills && volunteer.skills.length > 0 && (
                      <p className="text-sm text-primary-600 mt-1">
                        Disponibilità: {volunteer.skills.join(', ')}
                      </p>
                    )}
                    {volunteer.note && (
                      <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded inline-flex items-start gap-1">
                        <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                        <span>{volunteer.note}</span>
                      </p>
                    )}
                    {volunteer.cvUrl && (
                      <a
                        href={volunteer.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-info-600 hover:underline mt-1 inline-flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        Scarica CV
                      </a>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Candidatura del {formatDate(volunteer.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => setConfirmAction({ volunteer, action: 'approve' })}
                      disabled={actionLoading === volunteer.id}
                      loading={actionLoading === volunteer.id}
                    >
                      Approva
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setConfirmAction({ volunteer, action: 'reject' })}
                      disabled={actionLoading === volunteer.id}
                      loading={actionLoading === volunteer.id}
                    >
                      Rifiuta
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Volontari attivi</h2>
          {approved.length > 0 && (
            <Badge variant="success" size="sm">
              {approved.length}
            </Badge>
          )}
        </div>

        {approved.length === 0 ? (
          <EmptyState
            icon={HandHeart}
            title="Nessun volontario attivo"
            description="Non ci sono volontari attualmente attivi."
          />
        ) : (
          <div className="space-y-4">
            {approved.map((volunteer) => (
              <div key={volunteer.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <button
                      onClick={() => router.push(`/operator/recipients/${volunteer.user.id}`)}
                      className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      {volunteer.user.name} →
                    </button>
                    <p className="text-sm text-gray-500">{volunteer.user.email}</p>
                    {volunteer.skills && volunteer.skills.length > 0 && (
                      <p className="text-sm text-primary-600 mt-1">
                        Disponibilità: {volunteer.skills.join(', ')}
                      </p>
                    )}
                    {volunteer.cvUrl && (
                      <a
                        href={volunteer.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-info-600 hover:underline mt-1 inline-flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        Scarica CV
                      </a>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Attivo dal {formatDate(volunteer.startDate)}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmAction({ volunteer, action: 'suspend' })}
                    disabled={actionLoading === volunteer.id}
                    loading={actionLoading === volunteer.id}
                  >
                    Sospendi
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
