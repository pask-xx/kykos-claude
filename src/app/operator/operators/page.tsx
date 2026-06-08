'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { OPERATOR_ROLE_LABELS, OperatorRole } from '@/types';
import { toast } from '@/components/ui/Toast';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';

interface Operator {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: OperatorRole;
  active: boolean;
  isOfficeOperator: boolean;
  isStreetOperator: boolean;
  createdAt: string;
}

/**
 * Mappa Operator.active → Badge variant KYKOS.
 */
function activeBadge(active: boolean) {
  return active
    ? { variant: 'success' as const, label: 'Attivo' }
    : { variant: 'default' as const, label: 'Disattivato' };
}

/**
 * Mappa tipo operatore (office/street) → Badge variant KYKOS.
 * OFFICE = ufficio (info), STREET = strada (warning, ricorda danger).
 */
function operatorTypeBadge(isOffice: boolean, isStreet: boolean) {
  if (isOffice && isStreet) return { variant: 'primary' as const, label: 'Ufficio + Strada' };
  if (isOffice) return { variant: 'info' as const, label: 'Ufficio' };
  if (isStreet) return { variant: 'warning' as const, label: 'Strada' };
  return { variant: 'default' as const, label: '—' };
}

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const res = await fetch('/api/operator/operators');
      if (res.ok) {
        const data = await res.json();
        setOperators(data.operators || []);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err?.error || 'Errore');
      }
    } catch {
      setError('Errore di rete');
      toast.error('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operatori</h1>
          <p className="text-gray-500">{operators.length} operatori</p>
        </div>
      </div>

      {error && (
        <Alert type="error">{error}</Alert>
      )}

      {operators.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nessun operatore presente"
          description="Non ci sono operatori registrati per il tuo ente."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Operatore</TableHead>
              <TableHead>Contatti</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ruolo</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operators.map((op) => {
              const statusBadge = activeBadge(op.active);
              const typeBadge = operatorTypeBadge(op.isOfficeOperator, op.isStreetOperator);
              return (
                <TableRow key={op.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900">{op.firstName} {op.lastName}</div>
                    <div className="text-sm text-gray-500">@{op.username}</div>
                  </TableCell>
                  <TableCell>
                    {op.email && <div className="text-gray-700">{op.email}</div>}
                    {op.phone && <div className="text-gray-500">{op.phone}</div>}
                    {!op.email && !op.phone && <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={typeBadge.variant} size="sm">
                      {typeBadge.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="primary" size="sm">
                      {OPERATOR_ROLE_LABELS[op.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadge.variant} size="sm">
                      {statusBadge.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/operator/operators/${op.id}`}>
                      <Button variant="primary" size="sm">
                        Gestisci
                      </Button>
                    </Link>
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
