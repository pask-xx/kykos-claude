'use client';

import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/Toast';
import { EmptyState, Spinner, Tabs } from '@/components/ui';
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
                    score={recipient.needScore}
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
                authorizedRecipients.map((recipient) => (
                  <BeneficiaryCard
                    key={recipient.id}
                    beneficiary={recipient}
                    href={`/operator/recipients/${recipient.id}`}
                    isStreetManaged={recipient.isStreetManaged}
                    email={recipient.email}
                    score={recipient.needScore}
                    authorizedAt={recipient.authorizedAt}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
