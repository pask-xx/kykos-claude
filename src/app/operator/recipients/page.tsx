'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { Badge, EmptyState, Spinner, Tabs } from '@/components/ui';
import { BeneficiaryCard, type BeneficiaryCardData } from '@/components/operator/BeneficiaryCard';

interface Recipient extends BeneficiaryCardData {
  email: string;
  authorized: boolean;
  authorizedAt: string | null;
  createdAt: string;
  isee: string | null;
  needScore: number;
  isStreetManaged: boolean;
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
        <p className="text-gray-500">Clicca su un beneficiario per gestirlo</p>
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
            <div className="space-y-3">
              {pendingRecipients.length === 0 ? (
                <EmptyState
                  title="Nessuna richiesta in attesa"
                  description="Tutte le richieste sono state elaborate."
                />
              ) : (
                pendingRecipients.map((recipient) => (
                  <BeneficiaryCard
                    key={recipient.id}
                    beneficiary={recipient}
                    href={`/operator/recipients/${recipient.id}`}
                    isStreetManaged={recipient.isStreetManaged}
                    email={recipient.email}
                  />
                ))
              )}
            </div>
          )}

          {tab === 'authorized' && (
            <div className="space-y-3">
              {authorizedRecipients.length === 0 ? (
                <EmptyState
                  title="Nessun beneficiario autorizzato"
                  description="I beneficiari autorizzati appariranno qui."
                />
              ) : (
                authorizedRecipients.map((recipient) => {
                  const score = needScoreBadge(recipient.needScore);
                  return (
                    <div key={recipient.id} className="space-y-2">
                      <BeneficiaryCard
                        beneficiary={recipient}
                        href={`/operator/recipients/${recipient.id}`}
                        isStreetManaged={recipient.isStreetManaged}
                        email={recipient.email}
                      />
                      <div className="flex items-center gap-2 px-4 text-xs text-gray-500">
                        <Badge variant={score.variant} size="sm">
                          Score: {recipient.needScore} — {score.label}
                        </Badge>
                        <span>
                          {recipient.authorizedAt
                            ? `Autorizzato il ${formatDate(recipient.authorizedAt)}`
                            : 'Autorizzato (data non disponibile)'}
                        </span>
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
