'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Alert, Spinner, Modal, ModalFooter } from '@/components/ui';
import { CATEGORY_LABELS } from '@/types';
import ImageGallery from '@/components/ImageGallery';
import ConfirmDialog from '@/components/ConfirmDialog';

interface StreetBeneficiary {
  id: string;
  email: string | null;
  authUserId: string | null;
  emailConfirmed: boolean;
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
  needScore: number;
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

interface UnifiedItem {
  id: string;
  type: 'OBJECT' | 'GOODS';
  title: string;
  category: string;
  condition?: string;
  status: string;
  statusLabel: string;
  priority: number;
  imageUrls: string[];
  depositLocation?: string | null;
  objectId?: string;
  createdAt: string;
  qrLink?: string;
  offers?: Array<{
    id: string;
    message: string | null;
    status: string;
    imageUrls: string[];
    offeredBy: { id: string; name: string };
    createdAt: string;
  }>;
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
  const [unifiedItems, setUnifiedItems] = useState<UnifiedItem[]>([]);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [editingScore, setEditingScore] = useState(false);
  const [scoreValue, setScoreValue] = useState<number>(50);
  const [savingScore, setSavingScore] = useState(false);

  const handleOfferAction = async (offerId: string, action: 'accept' | 'reject') => {
    setAcceptingOfferId(offerId);
    try {
      const res = await fetch('/api/operator/goods-offers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, action }),
      });
      if (res.ok) {
        // Refresh the unified items
        fetchUnifiedItems();
      }
    } catch (err) {
      console.error('Error handling offer:', err);
    } finally {
      setAcceptingOfferId(null);
    }
  };

  useEffect(() => {
    fetchBeneficiary();
    fetchAssignedOperators();
    fetchUnifiedItems();
  }, [id]);

  const fetchBeneficiary = async () => {
    try {
      const res = await fetch(`/api/operator/street-beneficiaries/${id}`);
      if (!res.ok) throw new Error('Beneficiario non trovato');
      const data = await res.json();
      setBeneficiary(data.beneficiary);
      setScoreValue(data.beneficiary.needScore || 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  const updateNeedScore = async (newScore: number) => {
    setSavingScore(true);
    setError(null);
    try {
      const res = await fetch(`/api/operator/street-beneficiaries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needScore: newScore }),
      });

      if (res.ok) {
        setBeneficiary(prev => prev ? { ...prev, needScore: newScore } : null);
        setEditingScore(false);
      } else {
        const err = await res.json();
        setError(err.error || 'Errore');
      }
    } catch (err) {
      setError('Errore di rete');
    } finally {
      setSavingScore(false);
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

  const fetchAssignedOperators = async () => {
    try {
      const res = await fetch(`/api/operator/street-beneficiaries/${id}/operators`);
      if (res.ok) {
        const data = await res.json();
        setAssignedOperators(data.operators || []);
      }
    } catch (err) {
      console.error('Error fetching assigned operators:', err);
    }
  };

  const fetchUnifiedItems = async () => {
    try {
      const res = await fetch(`/api/operator/street-beneficiaries/${id}/objects`);
      if (res.ok) {
        const data = await res.json();
        setUnifiedItems(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching unified items:', err);
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

  const handleCreateAccount = async () => {
    setCreatingAccount(true);
    try {
      const res = await fetch(`/api/operator/street-beneficiaries/${id}/create-account`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchBeneficiary(); // Refresh to update account status
      } else {
        const data = await res.json();
        setError(data.error || 'Errore nella creazione account');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setCreatingAccount(false);
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
      case 'DELIVERED': return <Badge variant="success">Depositata</Badge>;
      case 'REJECTED': return <Badge variant="danger">Rifiutata</Badge>;
      case 'CANCELLED': return <Badge variant="default">Cancellata</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const getStatusVariant = (status: string): "default" | "primary" | "success" | "warning" | "danger" | "info" => {
    switch (status) {
      case 'DEPOSITED': return 'success';
      case 'RESERVED': return 'warning';
      case 'AVAILABLE': return 'primary';
      case 'DONATED': return 'info';
      case 'CANCELLED': return 'default';
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'FULFILLED': return 'info';
      case 'COMPLETED': return 'default';
      default: return 'default';
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
          {!beneficiary.authUserId && !beneficiary.emailConfirmed && beneficiary.email && (
            <ConfirmDialog
              title="Crea account"
              message={`Creare un account per ${beneficiary.firstName} ${beneficiary.lastName}? Riceverà un'email di conferma.`}
              confirmLabel="Crea account"
              variant="warning"
              onConfirm={handleCreateAccount}
            >
              <Button variant="primary" disabled={creatingAccount}>
                {creatingAccount ? 'Creazione...' : '🔑 Crea account'}
              </Button>
            </ConfirmDialog>
          )}
          <Button variant="secondary" onClick={() => router.push(`/operator/street-beneficiaries/${id}/edit`)}>
            Modifica
          </Button>
          <Button variant="primary" onClick={() => router.push(`/operator/street-beneficiaries/${id}/requests/new`)}>
            + Nuova richiesta
          </Button>
        </div>
      </div>

      {/* Score di Bisogno */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-2 border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">📊</span> Score di Bisogno
          </h2>
          {!editingScore && (
            <button
              onClick={() => setEditingScore(true)}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              modifica
            </button>
          )}
        </div>
        <div className="flex items-center gap-6">
          {/* Gauge */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="12"
              />
              {/* Colored arc */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={
                  beneficiary.needScore >= 80 ? '#dc2626' :
                  beneficiary.needScore >= 50 ? '#f59e0b' :
                  beneficiary.needScore >= 20 ? '#3b82f6' :
                  '#6b7280'
                }
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(beneficiary.needScore / 100) * 264} 264`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${
                beneficiary.needScore >= 80 ? 'text-red-600' :
                beneficiary.needScore >= 50 ? 'text-amber-600' :
                beneficiary.needScore >= 20 ? 'text-blue-600' :
                'text-gray-600'
              }`}>
                {beneficiary.needScore}
              </span>
              <span className="text-xs text-gray-400">/100</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            {editingScore ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={scoreValue}
                    onChange={(e) => setScoreValue(Number(e.target.value))}
                    className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <span className="font-bold text-xl w-14 text-center">{scoreValue}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateNeedScore(scoreValue)}
                    disabled={savingScore}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {savingScore ? 'Salvataggio...' : 'Salva'}
                  </button>
                  <button
                    onClick={() => { setEditingScore(false); setScoreValue(beneficiary.needScore); }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  {beneficiary.needScore >= 80 ? (
                    <span className="text-red-600 font-medium">🚨 Alta priorità</span>
                  ) : beneficiary.needScore >= 50 ? (
                    <span className="text-amber-600 font-medium">⚠️ Media priorità</span>
                  ) : beneficiary.needScore >= 20 ? (
                    <span className="text-blue-600 font-medium">ℹ️ Bassa priorità</span>
                  ) : (
                    <span className="text-gray-500 font-medium">✓ Priorità minima</span>
                  )}
                </p>
                <p className="text-sm text-gray-400">
                  0 = poco bisogno, 100 = molto bisogno
                </p>
              </div>
            )}
          </div>
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

      {/* Disponibilita */}
      <Card>
        <CardHeader>
          <CardTitle>Disponibilità ({unifiedItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {unifiedItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nessuna disponibilità per questo beneficiario</p>
            </div>
          ) : (
            <div className="space-y-4">
              {unifiedItems.map(item => (
                <div key={`${item.type}-${item.id}`} className="border rounded-lg overflow-hidden">
                  {/* Header row */}
                  <div className="flex items-center justify-between p-3 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {item.imageUrls && item.imageUrls.length > 0 ? (
                          <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">📦</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-gray-500">
                          {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] || item.category}
                          {item.type === 'GOODS' ? ' (Richiesta)' : ' (Oggetto)'}
                          {' • '}
                          {new Date(item.createdAt).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(item.status)}>{item.statusLabel}</Badge>
                      {item.qrLink && (
                        <Button variant="ghost" size="sm" onClick={() => router.push(item.qrLink!)} title="Mostra QR ritiro">
                          📱
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Offers for GOODS type */}
                  {item.type === 'GOODS' && item.offers && item.offers.length > 0 && (
                    <div className="border-t">
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Offerte ({item.offers.length})</p>
                        <div className="space-y-2">
                          {item.offers.map(offer => (
                            <OfferItem
                              key={offer.id}
                              offer={offer}
                              onAccept={(offerId) => handleOfferAction(offerId, 'accept')}
                              onReject={(offerId) => handleOfferAction(offerId, 'reject')}
                              acceptingId={acceptingOfferId}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
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

        <ModalFooter className="flex gap-3">
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
        </ModalFooter>
      </Modal>
    </div>
  );
}

function OfferItem({
  offer,
  onAccept,
  onReject,
  acceptingId,
}: {
  offer: {
    id: string;
    message: string | null;
    status: string;
    imageUrls: string[];
    offeredBy: { id: string; name: string };
    createdAt: string;
  };
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  acceptingId: string | null;
}) {
  const getOfferStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="warning">In attesa</Badge>;
      case 'ACCEPTED': return <Badge variant="success">Accettata</Badge>;
      case 'REJECTED': return <Badge variant="danger">Rifiutata</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="flex items-start gap-3 p-2 border rounded-lg bg-white">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">Donatore</span>
          {getOfferStatusBadge(offer.status)}
        </div>
        {offer.message && (
          <p className="text-sm text-gray-600 mb-1">{offer.message}</p>
        )}
        {offer.imageUrls && offer.imageUrls.length > 0 && (
          <div className="mt-2">
            <ImageGallery images={offer.imageUrls} alt="Foto offerta" />
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {new Date(offer.createdAt).toLocaleDateString('it-IT')}
        </p>
      </div>
      {offer.status === 'PENDING' && (
        <div className="flex gap-1">
          <ConfirmDialog
            title="Accetta offerta"
            message="Sei sicuro di voler accettare questa offerta? Il donatore riceverà un QR code per la consegna."
            confirmLabel="Accetta"
            variant="warning"
            onConfirm={() => onAccept(offer.id)}
          >
            <Button
              variant="primary"
              size="sm"
              loading={acceptingId === offer.id}
            >
              Accetta
            </Button>
          </ConfirmDialog>
          <ConfirmDialog
            title="Rifiuta offerta"
            message="Sei sicuro di voler rifiutare questa offerta?"
            confirmLabel="Rifiuta"
            variant="danger"
            onConfirm={() => onReject(offer.id)}
          >
            <Button
              variant="danger"
              size="sm"
              disabled={acceptingId === offer.id}
            >
              Rifiuta
            </Button>
          </ConfirmDialog>
        </div>
      )}
    </div>
  );
}
