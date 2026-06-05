'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, QrCode } from 'lucide-react';
import {
  Button, Card, CardHeader, CardTitle, CardContent, Alert,
  Skeleton, SkeletonCard, toast,
} from '@/components/ui';
import { CATEGORY_LABELS } from '@/types';
import { StatusBadge, type KykosStatus } from '@/lib/status-badge';
import { NeedScoreGauge } from '@/components/operator/NeedScoreGauge';
import { AssignOperatorsModal } from '@/components/operator/AssignOperatorsModal';
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

type Offer = NonNullable<UnifiedItem['offers']>[number];

export default function StreetBeneficiaryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [beneficiary, setBeneficiary] = useState<StreetBeneficiary | null>(null);
  const [assignedOperators, setAssignedOperators] = useState<AssignedOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOperatorsModal, setShowOperatorsModal] = useState(false);
  const [unifiedItems, setUnifiedItems] = useState<UnifiedItem[]>([]);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);

  useEffect(() => {
    fetchBeneficiary();
    fetchAssignedOperators();
    fetchUnifiedItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBeneficiary = async () => {
    try {
      const res = await fetch(`/api/operator/street-beneficiaries/${id}`);
      if (!res.ok) throw new Error('Beneficiario non trovato');
      const data = await res.json();
      setBeneficiary(data.beneficiary);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedOperators = async () => {
    try {
      const res = await fetch(`/api/operator/street-beneficiaries/${id}/operators`);
      if (res.ok) {
        const data = await res.json();
        setAssignedOperators(data.operators || []);
      }
    } catch {
      toast.error('Errore caricamento operatori');
    }
  };

  const fetchUnifiedItems = async () => {
    try {
      const res = await fetch(`/api/operator/street-beneficiaries/${id}/objects`);
      if (res.ok) {
        const data = await res.json();
        setUnifiedItems(data.items || []);
      }
    } catch {
      toast.error('Errore caricamento disponibilità');
    }
  };

  // Callback per NeedScoreGauge: salva il nuovo score, aggiorna state,
  // e segnala al gauge (via throw) se il salvataggio è fallito.
  const handleSaveScore = async (newScore: number) => {
    const res = await fetch(`/api/operator/street-beneficiaries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ needScore: newScore }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Errore salvataggio');
      throw new Error('save-failed');
    }

    setBeneficiary(prev => prev ? { ...prev, needScore: newScore } : null);
    toast.success('Score aggiornato');
  };

  const handleOfferAction = async (offerId: string, action: 'accept' | 'reject') => {
    setAcceptingOfferId(offerId);
    try {
      const res = await fetch('/api/operator/goods-offers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, action }),
      });
      if (res.ok) {
        toast.success(action === 'accept' ? 'Offerta accettata' : 'Offerta rifiutata');
        fetchUnifiedItems();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Errore durante l\'operazione');
      }
    } catch {
      toast.error('Errore di rete');
    } finally {
      setAcceptingOfferId(null);
    }
  };

  const handleCreateAccount = async () => {
    setCreatingAccount(true);
    try {
      const res = await fetch(`/api/operator/street-beneficiaries/${id}/create-account`, {
        method: 'POST',
      });
      if (res.ok) {
        toast.success('Account creato');
        fetchBeneficiary();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Errore nella creazione account');
      }
    } catch {
      toast.error('Errore di connessione');
    } finally {
      setCreatingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!beneficiary) {
    return (
      <Alert type="error" title="Errore">
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
            <span className="inline-flex items-center font-medium rounded px-2 py-0.5 text-xs bg-primary-100 text-primary-700 mt-1 font-mono">
              @{beneficiary.nickname}
            </span>
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
                {creatingAccount ? 'Creazione...' : 'Crea account'}
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
      <Card>
        <CardContent>
          <NeedScoreGauge
            score={beneficiary.needScore}
            editable
            onSave={handleSaveScore}
          />
        </CardContent>
      </Card>

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
                <span
                  className={`inline-flex items-center font-medium rounded px-2 py-0.5 text-xs ${
                    beneficiary.isStreetManaged
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {beneficiary.isStreetManaged ? 'Gestito da operatori di strada' : 'Non gestito'}
                </span>
              </div>
            </div>
          </div>

          {/* Operators */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-500 text-sm">Operatori assegnati</span>
              <Button variant="ghost" size="sm" onClick={() => setShowOperatorsModal(true)}>
                Gestisci operatori
              </Button>
            </div>
            {assignedOperators.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {assignedOperators.map(op => (
                  <span
                    key={op.id}
                    className="inline-flex items-center font-medium rounded px-2 py-0.5 text-xs bg-primary-100 text-primary-700"
                  >
                    {op.firstName} {op.lastName}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Nessun operatore assegnato</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Disponibilità */}
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
                          <Package className="h-5 w-5 text-gray-400" />
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
                      <StatusBadge
                        status={item.status as KykosStatus}
                        domain="object"
                        label={item.statusLabel}
                      />
                      {item.qrLink && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(item.qrLink!)}
                          aria-label="Mostra QR ritiro"
                          title="Mostra QR ritiro"
                        >
                          <QrCode className="h-4 w-4" />
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
      <AssignOperatorsModal
        beneficiaryId={id}
        beneficiaryName={`${beneficiary.firstName} ${beneficiary.lastName}`}
        isOpen={showOperatorsModal}
        onClose={() => setShowOperatorsModal(false)}
        onSave={fetchBeneficiary}
      />
    </div>
  );
}

function OfferItem({
  offer,
  onAccept,
  onReject,
  acceptingId,
}: {
  offer: Offer;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  acceptingId: string | null;
}) {
  return (
    <div className="flex items-start gap-3 p-2 border rounded-lg bg-white">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">Donatore</span>
          <StatusBadge status={offer.status as KykosStatus} domain="goodsOffer" />
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
