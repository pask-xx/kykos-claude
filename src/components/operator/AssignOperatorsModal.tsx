'use client';

import { useState, useEffect } from 'react';
import { UserCheck } from 'lucide-react';
import {
  Modal, ModalFooter, Button, Spinner, EmptyState, toast,
} from '@/components/ui';

interface Operator {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

export interface AssignOperatorsModalProps {
  beneficiaryId: string;
  beneficiaryName: string;
  isOpen: boolean;
  onClose: () => void;
  /** Callback opzionale per refresh parent dopo salvataggio andato a buon fine. */
  onSave?: () => void;
}

/**
 * <AssignOperatorsModal> — modale self-contained per assegnare operatori
 * di strada a un beneficiario.
 *
 * Gestisce internamente:
 *  - 2 fetch paralleli (lista operatori + operatori già assegnati)
 *  - state di selezione multipla
 *  - salvataggio via POST /api/operator/street-beneficiaries/{id}/operators
 *  - feedback toast (success/error) + chiusura automatica
 *
 * Non usa zod (è una selezione multipla, non un form testuale).
 * Riusabile da altre pagine del modulo (es. lista beneficiari) con la
 * stessa logica.
 */
export function AssignOperatorsModal({
  beneficiaryId,
  beneficiaryName,
  isOpen,
  onClose,
  onSave,
}: AssignOperatorsModalProps) {
  const [allOperators, setAllOperators] = useState<Operator[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch parallelo all'apertura del modale
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const loadOperators = async () => {
      setLoading(true);
      setSelectedIds([]);
      try {
        const [opsRes, assignedRes] = await Promise.all([
          fetch('/api/operator/street-operators'),
          fetch(`/api/operator/street-beneficiaries/${beneficiaryId}/operators`),
        ]);

        if (cancelled) return;

        if (opsRes.ok) {
          const opsData = await opsRes.json();
          setAllOperators(opsData.streetOperators || []);
        }

        if (assignedRes.ok) {
          const assignedData = await assignedRes.json();
          setSelectedIds(assignedData.operators?.map((op: Operator) => op.id) || []);
        }
      } catch {
        if (!cancelled) toast.error('Errore nel caricamento degli operatori');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadOperators();
    return () => { cancelled = true; };
  }, [isOpen, beneficiaryId]);

  const handleToggle = (id: string, checked: boolean) => {
    setSelectedIds(prev =>
      checked ? [...prev, id] : prev.filter(x => x !== id)
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/operator/street-beneficiaries/${beneficiaryId}/operators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorIds: selectedIds }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Errore nel salvataggio');
        return;
      }

      toast.success('Operatori assegnati');
      onSave?.();
      onClose();
    } catch {
      toast.error('Errore di connessione');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestisci operatori" size="md">
      <div className="p-6">
        <p className="text-sm text-gray-500 mb-4">
          Beneficiario: <strong>{beneficiaryName}</strong>
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : allOperators.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="Nessun operatore di strada disponibile"
          />
        ) : (
          <div className="space-y-2">
            {allOperators.map(op => {
              const isSelected = selectedIds.includes(op.id);
              return (
                <label
                  key={op.id}
                  htmlFor={`assign-op-${op.id}`}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <input
                    id={`assign-op-${op.id}`}
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleToggle(op.id, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {op.firstName} {op.lastName}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {op.email || '-'}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <ModalFooter>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={saving}
          >
            Annulla
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            loading={saving}
            disabled={loading}
            className="flex-1"
          >
            Salva
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
