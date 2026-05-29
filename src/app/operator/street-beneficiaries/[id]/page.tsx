'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Alert, Spinner } from '@/components/ui';
import { CATEGORY_LABELS } from '@/types';

interface StreetBeneficiary {
  id: string;
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
  createdAt: string;
  isStreetManaged: boolean;
  referenceEntity?: {
    id: string;
    name: string;
    city: string | null;
  };
}

interface GoodsRequest {
  id: string;
  title: string;
  category: string;
  type: string;
  status: string;
  createdAt: string;
  description: string | null;
}

interface AssignedOperator {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

export default function StreetBeneficiaryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [beneficiary, setBeneficiary] = useState<StreetBeneficiary | null>(null);
  const [requests, setRequests] = useState<GoodsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOperatorsModal, setShowOperatorsModal] = useState(false);
  const [assignedOperators, setAssignedOperators] = useState<AssignedOperator[]>([]);
  const [allOperators, setAllOperators] = useState<AssignedOperator[]>([]);
  const [selectedOperatorIds, setSelectedOperatorIds] = useState<string[]>([]);
  const [savingOperators, setSavingOperators] = useState(false);
  const [loadingOperators, setLoadingOperators] = useState(false);

  useEffect(() => {
    fetchBeneficiary();
    fetchRequests();
  }, [id]);

  const fetchBeneficiary = async () => {
    try {
      const res = await fetch(`/api/operator/street-beneficiaries/${id}`);
      if (!res.ok) throw new Error('Beneficiario non trovato');
      const data = await res.json();
      setBeneficiary(data.beneficiary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch(`/api/operator/street-beneficiary-requests?beneficiaryId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    }
  };

  const openOperatorsModal = async () => {
    setShowOperatorsModal(true);
    setLoadingOperators(true);
    setSelectedOperatorIds([]);

    try {
      const [opsRes, assignedRes] = await Promise.all([
        fetch('/api/operator/street-operators'),
        fetch(`/api/operator/street-beneficiaries/${id}/operators`),
      ]);

      if (opsRes.ok) {
        const opsData = await opsRes.json();
        setAllOperators(opsData.streetOperators || []);
      }

      if (assignedRes.ok) {
        const assignedData = await assignedRes.json();
        setAssignedOperators(assignedData.operators || []);
        setSelectedOperatorIds(assignedData.operators?.map((op: AssignedOperator) => op.id) || []);
      }
    } catch (err) {
      console.error('Error loading operators:', err);
    } finally {
      setLoadingOperators(false);
    }
  };

  const saveOperatorsAssignment = async () => {
    setSavingOperators(true);
    try {
      const res = await fetch(`/api/operator/street-beneficiaries/${id}/operators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorIds: selectedOperatorIds }),
      });

      if (res.ok) {
        setShowOperatorsModal(false);
        fetchBeneficiary();
      }
    } catch (err) {
      console.error('Error saving operators:', err);
    } finally {
      setSavingOperators(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!beneficiary) {
    return (
      <Alert type="error" title="Errore">
        {error || 'Beneficiario non trovato'}
        <div className="mt-4">
          <Link href="/operator/street-beneficiaries">
            <Button variant="secondary">Torna ai beneficiari</Button>
          </Link>
        </div>
      </Alert>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="warning">In attesa</Badge>;
      case 'APPROVED': return <Badge variant="success">Approvata</Badge>;
      case 'FULFILLED': return <Badge variant="info">Soddisfatta</Badge>;
      case 'DELIVERED': return <Badge variant="success">Consegnata</Badge>;
      case 'REJECTED': return <Badge variant="danger">Rifiutata</Badge>;
      case 'CANCELLED': return <Badge variant="default">Cancellata</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/operator/street-beneficiaries" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-flex items-center gap-1">
            ← Torna ai beneficiari
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {beneficiary.firstName} {beneficiary.lastName}
          </h1>
          {beneficiary.nickname && (
            <Badge variant="primary" size="sm" className="mt-1 font-mono">@{beneficiary.nickname}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push(`/operator/street-beneficiaries/${id}/edit`)}>
            Modifica
          </Button>
          <Button variant="primary" onClick={() => router.push(`/operator/street-beneficiaries/${id}/requests/new`)}>
            + Nuova richiesta
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informazioni beneficiario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <span className="text-gray-500 text-sm">Nome completo</span>
              <p className="font-medium">{beneficiary.firstName} {beneficiary.lastName}</p>
            </div>
            {beneficiary.nickname && (
              <div>
                <span className="text-gray-500 text-sm">Nickname</span>
                <p className="font-medium font-mono">@{beneficiary.nickname}</p>
              </div>
            )}
            <div>
              <span className="text-gray-500 text-sm">Codice Fiscale</span>
              <p className="font-medium">{beneficiary.fiscalCode || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Data di nascita</span>
              <p className="font-medium">{beneficiary.birthDate ? new Date(beneficiary.birthDate).toLocaleDateString('it-IT') : '-'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">ISEE</span>
              <p className="font-medium">{beneficiary.isee ? `€${parseFloat(beneficiary.isee).toLocaleString('it-IT')}` : '-'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Indirizzo</span>
              <p className="font-medium">{beneficiary.address || '-'}{beneficiary.houseNumber ? `, ${beneficiary.houseNumber}` : ''}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">CAP</span>
              <p className="font-medium">{beneficiary.cap || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Città</span>
              <p className="font-medium">{beneficiary.city || '-'} {beneficiary.province ? `(${beneficiary.province})` : ''}</p>
            </div>
            {beneficiary.referenceEntity && (
              <div>
                <span className="text-gray-500 text-sm">Ente di riferimento</span>
                <p className="font-medium">{beneficiary.referenceEntity.name}</p>
              </div>
            )}
            <div>
              <span className="text-gray-500 text-sm">Data registrazione</span>
              <p className="font-medium">{new Date(beneficiary.createdAt).toLocaleDateString('it-IT')}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Stato</span>
              <div className="mt-1">
                <Badge variant={beneficiary.isStreetManaged ? 'success' : 'default'}>
                  {beneficiary.isStreetManaged ? 'Gestito da operatori di strada' : 'Non gestito'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Operators */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-500 text-sm">Operatori assegnati</span>
              <Button variant="ghost" size="sm" onClick={openOperatorsModal}>
                Gestisci operatori
              </Button>
            </div>
            {assignedOperators.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {assignedOperators.map(op => (
                  <Badge key={op.id} variant="primary">
                    {op.firstName} {op.lastName}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Nessun operatore assegnato</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Richieste ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nessuna richiesta per questo beneficiario</p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => router.push(`/operator/street-beneficiaries/${id}/requests/new`)}
              >
                Crea prima richiesta
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{req.title}</p>
                      <p className="text-sm text-gray-500">
                        {CATEGORY_LABELS[req.category as keyof typeof CATEGORY_LABELS] || req.category}
                        {' • '}
                        {req.type === 'GOODS' ? 'Bene' : 'Servizio'}
                        {' • '}
                        {new Date(req.createdAt).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(req.status)}
                    <Button variant="ghost" size="sm">Dettagli</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assegna Operatori Modal */}
      <Modal
        isOpen={showOperatorsModal}
        onClose={() => setShowOperatorsModal(false)}
        title="Gestisci operatori"
        size="md"
      >
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            Beneficiario: <strong>{beneficiary.firstName} {beneficiary.lastName}</strong>
          </p>

          {loadingOperators ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : allOperators.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nessun operatore di strada disponibile</p>
          ) : (
            <div className="space-y-2">
              {allOperators.map(op => (
                <label
                  key={op.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                    selectedOperatorIds.includes(op.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedOperatorIds.includes(op.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOperatorIds(prev => [...prev, op.id]);
                      } else {
                        setSelectedOperatorIds(prev => prev.filter(oid => oid !== op.id));
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{op.firstName} {op.lastName}</p>
                    <p className="text-sm text-gray-500">{op.email || '-'}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t bg-gray-50">
          <Button
            variant="secondary"
            onClick={() => setShowOperatorsModal(false)}
            className="flex-1"
          >
            Annulla
          </Button>
          <Button
            variant="primary"
            onClick={saveOperatorsAssignment}
            loading={savingOperators}
            className="flex-1"
          >
            Salva
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children, size = 'md' }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
