'use client';

import { useState, useEffect } from 'react';
import { Gift } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { EmptyState, Spinner } from '@/components/ui';
import { DonorCard, type DonorCardData } from '@/components/operator/DonorCard';

type Donor = DonorCardData;

export default function DonorsListPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDonors = async () => {
    try {
      const res = await fetch('/api/operator/donors');
      if (res.ok) {
        const data = await res.json();
        setDonors(data.donors);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Errore');
      }
    } catch {
      toast.error('Errore di rete');
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Donatori</h1>
        <p className="text-gray-500 text-sm">Gestisci i donatori che donano al tuo ente</p>
      </div>

      {donors.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="Nessun donatore presente"
          description="Non ci sono donatori associati a questo ente."
        />
      ) : (
        <div className="space-y-4">
          {donors.map((donor) => (
            <DonorCard key={donor.id} donor={donor} />
          ))}
        </div>
      )}
    </div>
  );
}
