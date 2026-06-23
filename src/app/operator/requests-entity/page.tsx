'use client';

import { useState, useEffect } from 'react';
import { Armchair, Smartphone, Shirt, Book, CookingPot, Trophy, Baby, Box, Wrench, ClipboardList, type LucideIcon } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { CATEGORY_LABELS, Category } from '@/types';
import { Badge, EmptyState, Input, Select, Spinner, EntityListCard } from '@/components/ui';

interface EntityRequest {
  id: string;
  title: string;
  category: string;
  description: string | null;
  type: string;
  status: string;
  createdAt: string;
  beneficiary: {
    id: string;
    nickname: string | null;
    name: string;
  };
  intermediary: {
    id: string;
    name: string;
  };
  fulfilledBy: {
    id: string;
    nickname: string | null;
    name: string;
  } | null;
  offers: Array<{
    id: string;
    message: string | null;
    status: string;
    createdAt: string;
    offeredBy: {
      id: string;
      nickname: string | null;
      name: string;
    };
  }>;
}

/**
 * Mappa EntityRequest.status → Badge variant KYKOS.
 * 6 stati totali (PENDING, APPROVED, FULFILLED, DELIVERED, COMPLETED, CANCELLED).
 * vedi: src/types/GoodsRequestStatus.
 */
function requestStatusBadge(status: string) {
  switch (status) {
    case 'PENDING': return { variant: 'warning' as const, label: 'In attesa' };
    case 'APPROVED': return { variant: 'success' as const, label: 'Approvata' };
    case 'FULFILLED': return { variant: 'info' as const, label: 'Soddisfatta' };
    case 'DELIVERED': return { variant: 'primary' as const, label: 'Consegnata' };
    case 'COMPLETED': return { variant: 'success' as const, label: 'Completata' };
    case 'CANCELLED': return { variant: 'default' as const, label: 'Cancellata' };
    default: return { variant: 'default' as const, label: status };
  }
}

function getCategoryIcon(category: string): LucideIcon {
  const icons: Record<string, LucideIcon> = {
    FURNITURE: Armchair,
    ELECTRONICS: Smartphone,
    CLOTHING: Shirt,
    BOOKS: Book,
    KITCHEN: CookingPot,
    SPORTS: Trophy,
    TOYS: Baby,
    OTHER: Box,
  };
  return icons[category] || Box;
}

export default function OperatorEntityRequestsPage() {
  const [requests, setRequests] = useState<EntityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/operator/requests-entity');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (r.beneficiary.nickname?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      r.beneficiary.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || r.type === filterType;
    const matchesCategory = !filterCategory || r.category === filterCategory;
    const matchesStatus = !filterStatus || r.status === filterStatus;
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const statuses = [...new Set(requests.map(r => r.status))];

  const typeOptions = [
    { value: '', label: 'Tutti i tipi' },
    { value: 'GOODS', label: 'Beni' },
    { value: 'SERVICES', label: 'Servizi' },
  ];

  // Categorie fisse (8 di Category enum) per permettere all'operatore
  // di filtrare anche se NESSUNA richiesta della categoria è ancora presente.
  // Coerente con la categoria del tipo "beni" (SERVICES non ha categoria
  // merceologica, ma il campo è valorizzato per retro-compat).
  const categoryOptions = [
    { value: '', label: 'Tutte le categorie' },
    ...(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => ({
      value: cat,
      label: CATEGORY_LABELS[cat],
    })),
  ];

  const statusOptions = [
    { value: '', label: 'Tutti gli stati' },
    ...statuses.map(status => {
      const badge = requestStatusBadge(status);
      return { value: status, label: badge.label };
    }),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Richieste</h1>
        <p className="text-gray-500">{filteredRequests.length} richieste</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col gap-4">
        <Input
          type="text"
          placeholder="Cerca per titolo, descrizione o richiedente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={typeOptions}
            className="flex-1 min-w-[140px]"
          />
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            options={categoryOptions}
            className="flex-1 min-w-[140px]"
          />
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={statusOptions}
            className="flex-1 min-w-[140px]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nessuna richiesta"
          description="Non ci sono richieste che corrispondono ai filtri."
        />
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const statusBadge = requestStatusBadge(request.status);
            const CategoryIcon = getCategoryIcon(request.category);
            return (
              <EntityListCard
                key={request.id}
                href={`/operator/requests-entity/${request.id}`}
                icon={
                  request.type === 'SERVICES' ? (
                    <Wrench className="w-7 h-7 sm:w-8 sm:h-8 text-secondary-700" aria-hidden="true" />
                  ) : (
                    <CategoryIcon className="w-7 h-7 sm:w-8 sm:h-8 text-gray-700" aria-hidden="true" />
                  )
                }
                title={request.title}
                badgesTop={
                  <>
                    <Badge variant={request.type === 'GOODS' ? 'info' : 'primary'} size="sm">
                      {request.type === 'GOODS' ? 'Bene' : 'Servizio'}
                    </Badge>
                    <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                    {request.offers.length > 0 && (
                      <Badge variant="info" size="sm">
                        {request.offers.length} {request.offers.length === 1 ? 'offerta' : 'offerte'}
                      </Badge>
                    )}
                  </>
                }
                meta={`Richiesta da ${request.beneficiary.nickname || request.beneficiary.name} • ${formatDate(request.createdAt)}`}
                description={request.description}
                ariaLabel={`Apri richiesta ${request.title}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
