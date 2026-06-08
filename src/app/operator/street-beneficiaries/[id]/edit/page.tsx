'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Card, CardContent, Badge, Alert,
  Button, Skeleton, SkeletonCard, SkeletonText, toast,
} from '@/components/ui';
import { BeneficiaryForm } from '@/components/operator/BeneficiaryForm';

interface StreetBeneficiary {
  id: string;
  email: string | null;
  nickname: string | null;
  firstName: string;
  lastName: string;
  fiscalCode: string | null;
  birthDate: string | null;
  address: string | null;
  houseNumber: string | null;
  cap: string | null;
  city: string | null;
  province: string | null;
  isee: string | null;
  latitude: number | null;
  longitude: number | null;
  isStreetManaged: boolean;
  createdAt: string;
  authUserId: string | null;
  emailConfirmed: boolean;
  needScore: number | null;
  referenceEntity?: {
    id: string;
    name: string;
    city: string | null;
  };
}

export default function EditStreetBeneficiaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [beneficiary, setBeneficiary] = useState<StreetBeneficiary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBeneficiary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBeneficiary = async () => {
    try {
      const res = await fetch(`/api/operator/street-beneficiaries/${id}`);
      if (!res.ok) throw new Error('Beneficiario non trovato');
      const data = await res.json();
      setBeneficiary(data.beneficiary as StreetBeneficiary);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <SkeletonCard />
        <SkeletonText lines={5} />
      </div>
    );
  }

  if (!beneficiary) {
    return (
      <Alert type="error" title="Errore" icon={<AlertCircle />}>
        Beneficiario non trovato
        <div className="mt-4">
          <Link href="/operator/street-beneficiaries">
            <Button variant="secondary">Torna ai beneficiari</Button>
          </Link>
        </div>
      </Alert>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/operator/street-beneficiaries/${id}`}
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-flex items-center gap-1"
        >
          ← Dettaglio beneficiario
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Modifica: {beneficiary.firstName} {beneficiary.lastName}
        </h1>
      </div>

      {/* Account Status */}
      {beneficiary.authUserId || beneficiary.emailConfirmed ? (
        <Card>
          <CardContent className="py-4">
            <Badge variant="success">
              <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
              Account attivo
            </Badge>
          </CardContent>
        </Card>
      ) : (
        <Alert
          type="warning"
          title="Senza account"
          icon={<AlertCircle aria-hidden="true" />}
        >
          {!beneficiary.email && "Per creare un account, inserisci l'email della persona qui sotto"}
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardContent>
          <BeneficiaryForm
            mode="edit"
            beneficiaryId={id}
            initialData={beneficiary}
            showEmail
            showNeedScore
            onSuccess={() => router.push(`/operator/street-beneficiaries/${id}`)}
            onCancel={() => router.push(`/operator/street-beneficiaries/${id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
