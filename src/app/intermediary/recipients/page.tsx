'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { SearchX, Users } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';

interface Recipient {
  id: string;
  name: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fiscalCode: string | null;
  city: string | null;
  authorized: boolean;
  authorizedAt: string | null;
  createdAt: string;
  isee: string | null;
  _count: {
    requests: number;
  };
}

function formatIsee(value: string | null): string {
  if (!value) return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return `€${num.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Mappa Recipient.authorized → Badge variant KYKOS.
 */
function authorizedBadge(authorized: boolean) {
  return authorized
    ? { variant: 'success' as const, label: 'Autorizzato' }
    : { variant: 'warning' as const, label: 'In attesa' };
}

export default function IntermediaryRecipientsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    try {
      const res = await fetch('/api/intermediary/recipients');
      const data = await res.json();
      setRecipients(data.recipients || []);
      setOrganizationName(data.organizationName || '');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async (recipientId: string, authorize: boolean) => {
    try {
      const res = await fetch('/api/intermediary/recipients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, authorize }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Errore');
        return;
      }

      toast.success(authorize ? 'Beneficiario autorizzato' : 'Autorizzazione revocata');
      fetchRecipients();
    } catch {
      toast.error('Errore di connessione');
    }
  };

  const filteredRecipients = useMemo(() => {
    if (!search) return recipients;
    const s = search.toLowerCase();
    return recipients.filter((r) => {
      const fullName = `${r.firstName || ''} ${r.lastName || ''} ${r.name || ''}`.toLowerCase();
      return (
        fullName.includes(s) ||
        r.email.toLowerCase().includes(s) ||
        (r.city && r.city.toLowerCase().includes(s)) ||
        (r.fiscalCode && r.fiscalCode.toLowerCase().includes(s))
      );
    });
  }, [recipients, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestione Beneficiari</h1>
      <p className="text-gray-500 mb-8">{organizationName}</p>

      {/* Search */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Cerca per nome, email, città o codice fiscale..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {recipients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nessun beneficiario"
          description="Non ci sono beneficiari che fanno riferimento al tuo ente."
        />
      ) : filteredRecipients.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nessun risultato"
          description={`Nessun beneficiario trovato per "${search}"`}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Città</TableHead>
              <TableHead>Codice Fiscale</TableHead>
              <TableHead>ISEE</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Richieste</TableHead>
              <TableHead>Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecipients.map((recipient) => {
              const statusBadge = authorizedBadge(recipient.authorized);
              return (
                <TableRow key={recipient.id}>
                  <TableCell>
                    <button
                      onClick={() => router.push(`/intermediary/recipients/${recipient.id}`)}
                      className="text-left hover:underline"
                    >
                      <p className="font-medium text-primary-600">
                        {recipient.firstName && recipient.lastName
                          ? `${recipient.firstName} ${recipient.lastName}`
                          : recipient.name}
                      </p>
                      <p className="text-sm text-gray-500">{recipient.email}</p>
                    </button>
                  </TableCell>
                  <TableCell>{recipient.city || '—'}</TableCell>
                  <TableCell className="font-mono uppercase">
                    {recipient.fiscalCode || '—'}
                  </TableCell>
                  <TableCell>{formatIsee(recipient.isee)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant={statusBadge.variant} size="sm">
                        {statusBadge.label}
                      </Badge>
                      {recipient.authorized && recipient.authorizedAt && (
                        <p className="text-xs text-gray-400">
                          dal {formatDate(recipient.authorizedAt)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{recipient._count.requests}</TableCell>
                  <TableCell>
                    {recipient.authorized ? (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleAuthorize(recipient.id, false)}
                      >
                        Revoca
                      </Button>
                    ) : (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleAuthorize(recipient.id, true)}
                      >
                        Autorizza
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
