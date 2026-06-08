'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { Avatar, Badge, Button, EmptyState, Spinner, Tabs } from '@/components/ui';

interface Recipient {
  id: string;
  nickname: string | null;
  name: string;
  email: string;
  authorized: boolean;
  authorizedAt: string | null;
  createdAt: string;
  isee: string | null;
  needScore: number;
  profileImageUrl: string | null;
}

type RecipientTab = 'pending' | 'authorized';

/**
 * Traduzione NeedScore (0-100) → Badge variant KYKOS. Le soglie sono
 * codificate in `RecipientNeedScore` memory: 80+ = alto (danger), 50+ = medio
 * (warning), 20+ = basso (info), <20 = minimo (default).
 */
function needScoreBadge(score: number) {
  if (score >= 80) return { variant: 'danger' as const, label: 'Alto' };
  if (score >= 50) return { variant: 'warning' as const, label: 'Medio' };
  if (score >= 20) return { variant: 'info' as const, label: 'Basso' };
  return { variant: 'default' as const, label: 'Minimo' };
}

export default function OperatorRecipientsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [tab, setTab] = useState<RecipientTab>('pending');

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    try {
      const res = await fetch('/api/operator/recipients');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Errore nel caricamento');
        return;
      }
      const data = await res.json();
      setRecipients(data.recipients || []);
    } catch (err) {
      toast.error('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async (recipientId: string, authorize: boolean) => {
    setProcessing(recipientId);
    try {
      const res = await fetch('/api/operator/recipients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, authorize }),
      });

      if (res.ok) {
        fetchRecipients();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Errore');
      }
    } catch {
      toast.error('Errore di connessione');
    } finally {
      setProcessing(null);
    }
  };

  const pendingRecipients = recipients.filter((r) => !r.authorized);
  const authorizedRecipients = recipients.filter((r) => r.authorized);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestione beneficiari</h1>
        <p className="text-gray-500">Autorizza o revoca l&apos;accesso ai beneficiari</p>
      </div>

      {recipients.length === 0 ? (
        <EmptyState
          icon={undefined}
          title="Nessun beneficiario"
          description="Non ci sono beneficiari associati a questo ente."
        />
      ) : (
        <>
          <Tabs<RecipientTab>
            value={tab}
            onChange={setTab}
            items={[
              { value: 'pending', label: 'In attesa', count: pendingRecipients.length },
              { value: 'authorized', label: 'Autorizzati', count: authorizedRecipients.length },
            ]}
            variant="default"
            ariaLabel="Filtra beneficiari per stato autorizzazione"
          />

          {tab === 'pending' && (
            <div className="space-y-4">
              {pendingRecipients.length === 0 ? (
                <EmptyState
                  title="Nessuna richiesta in attesa"
                  description="Tutte le richieste sono state elaborate."
                />
              ) : (
                pendingRecipients.map((recipient) => (
                  <div key={recipient.id} className="bg-white p-4 rounded-xl shadow-sm border-2 border-amber-200">
                    <div className="flex gap-3">
                      <Avatar
                        src={recipient.profileImageUrl}
                        alt={recipient.name}
                        name={recipient.name}
                        fallbackName={recipient.nickname?.charAt(0)}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/operator/recipients/${recipient.id}`}
                              className="font-semibold text-gray-900 hover:text-primary-600"
                            >
                              {recipient.nickname || recipient.name}
                            </Link>
                            <p className="text-sm text-gray-500 truncate">{recipient.email}</p>
                          </div>
                        </div>
                        {recipient.isee && (
                          <p className="text-sm text-gray-500 mt-1">ISEE: €{recipient.isee}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Registrato il {formatDate(recipient.createdAt)}
                        </p>
                        <div className="mt-3">
                          <Button
                            onClick={() => handleAuthorize(recipient.id, true)}
                            disabled={processing === recipient.id}
                            variant="primary"
                            className="w-full"
                          >
                            {processing === recipient.id ? 'Elaborazione...' : 'Autorizza'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'authorized' && (
            <div className="space-y-4">
              {authorizedRecipients.length === 0 ? (
                <EmptyState
                  title="Nessun beneficiario autorizzato"
                  description="I beneficiari autorizzati appariranno qui."
                />
              ) : (
                authorizedRecipients.map((recipient) => {
                  const score = needScoreBadge(recipient.needScore);
                  return (
                    <div key={recipient.id} className="bg-white p-4 rounded-xl shadow-sm border">
                      <div className="flex gap-3">
                        <Avatar
                          src={recipient.profileImageUrl}
                          alt={recipient.name}
                          name={recipient.name}
                          fallbackName={recipient.nickname?.charAt(0)}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link
                                href={`/operator/recipients/${recipient.id}`}
                                className="font-semibold text-gray-900 hover:text-primary-600"
                              >
                                {recipient.nickname || recipient.name}
                              </Link>
                              <p className="text-sm text-gray-500 truncate">{recipient.email}</p>
                            </div>
                            <Link href={`/operator/recipients/${recipient.id}`}>
                              <Button variant="ghost" size="sm">
                                Gestisci
                              </Button>
                            </Link>
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={score.variant}>
                              Score: {recipient.needScore} — {score.label}
                            </Badge>
                          </div>

                          <p className="text-xs text-gray-400 mt-2">
                            {recipient.authorizedAt && recipient.authorizedAt !== 'null'
                              ? `Autorizzato il ${formatDate(recipient.authorizedAt)}`
                              : 'Autorizzato (data non disponibile)'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
