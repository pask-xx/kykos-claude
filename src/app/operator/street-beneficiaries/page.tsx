'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users } from 'lucide-react';
import {
  Button, Card, CardHeader, CardTitle, CardContent,
  EmptyState, SkeletonCard, toast,
} from '@/components/ui';
import { BeneficiaryForm } from '@/components/operator/BeneficiaryForm';
import { BeneficiaryCard, type BeneficiaryCardData } from '@/components/operator/BeneficiaryCard';

interface StreetBeneficiary extends BeneficiaryCardData {
  fiscalCode: string | null;
  birthDate: string | null;
  houseNumber: string | null;
  cap: string | null;
  province: string | null;
  isee: string | null;
  latitude: number | null;
  longitude: number | null;
  isStreetManaged: boolean;
  createdAt: string;
  assignedAt: string;
  referenceEntity?: { id: string; name: string; city: string | null };
}

export default function StreetBeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState<StreetBeneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchBeneficiaries = useCallback(async () => {
    try {
      const res = await fetch('/api/operator/street-beneficiaries');
      if (!res.ok) throw new Error('Errore nel caricamento');
      const data = await res.json();
      setBeneficiaries(data.beneficiaries || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore generico');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBeneficiaries();
  }, [fetchBeneficiaries]);

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Beneficiari street</h1>
          <p className="text-sm text-gray-500 mt-1">
            Beneficiari senza account gestiti da te
          </p>
        </div>
        <Button
          variant={showForm ? 'secondary' : 'primary'}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Annulla' : '+ Nuovo beneficiario'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nuovo beneficiario</CardTitle>
          </CardHeader>
          <CardContent>
            <BeneficiaryForm
              mode="create"
              onSuccess={() => {
                setShowForm(false);
                fetchBeneficiaries();
              }}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {beneficiaries.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nessun beneficiario"
          description="Nessun beneficiario gestito da te al momento."
          action={
            !showForm ? (
              <Button variant="primary" onClick={() => setShowForm(true)}>
                + Aggiungi il primo
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {beneficiaries.map((b) => (
            <BeneficiaryCard key={b.id} beneficiary={b} />
          ))}
        </div>
      )}
    </div>
  );
}
