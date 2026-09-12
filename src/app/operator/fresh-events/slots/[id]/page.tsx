'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Apple,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  UserCheck,
  UserX,
  QrCode,
  AlertTriangle,
  Save,
  CheckCircle2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  EmptyState,
  Spinner,
  Alert,
  SectionDivider,
  Textarea,
  Input,
} from '@/components/ui';
import { toast } from '@/components/ui/Toast';

interface Reservation {
  id: string;
  status: 'CONFIRMED' | 'WAITING' | 'ADMITTED' | 'PICKED_UP' | 'NO_SHOW' | 'CANCELLED' | 'EXPIRED';
  position: number | null;
  reservedAt: string;
  admittedAt: string | null;
  pickedUpAt: string | null;
  beneficiary: { id: string; firstName: string; lastName: string; nickname: string | null };
}

interface Slot {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  capacity: number;
  reservedCount: number;
  waitingCount: number;
  pickupInstructions: string | null;
  status: 'PUBLISHED' | 'FULL' | 'CLOSED' | 'COMPLETED' | 'CANCELLED';
  template: { id: string; title: string };
  pickupLocation: { id: string; address: string; city: string } | null;
  reservations: Reservation[];
}

function slotStatusBadge(s: Slot['status']) {
  switch (s) {
    case 'PUBLISHED': return { variant: 'success' as const, label: 'Aperto' };
    case 'FULL': return { variant: 'warning' as const, label: 'Pieno' };
    case 'CLOSED': return { variant: 'default' as const, label: 'Chiuso' };
    case 'COMPLETED': return { variant: 'default' as const, label: 'Concluso' };
    case 'CANCELLED': return { variant: 'danger' as const, label: 'Annullato' };
  }
}

function reservationStatusBadge(s: Reservation['status']) {
  switch (s) {
    case 'CONFIRMED': return { variant: 'success' as const, label: 'Confermato' };
    case 'WAITING': return { variant: 'info' as const, label: 'In lista' };
    case 'ADMITTED': return { variant: 'success' as const, label: 'Ammesso' };
    case 'PICKED_UP': return { variant: 'default' as const, label: 'Ritirato' };
    case 'NO_SHOW': return { variant: 'danger' as const, label: 'No-show' };
    case 'CANCELLED': return { variant: 'default' as const, label: 'Annullata' };
    case 'EXPIRED': return { variant: 'default' as const, label: 'Scaduta' };
  }
}

export default function SlotDetailPage() {
  const params = useParams<{ id: string }>();
  const [slot, setSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingInstructions, setEditingInstructions] = useState(false);
  const [instructionsDraft, setInstructionsDraft] = useState('');
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchSlot();
  }, [params.id]);

  const fetchSlot = async () => {
    try {
      const res = await fetch(`/api/operator/fresh-events/slots/${params.id}`);
      if (!res.ok) throw new Error('Errore');
      const data = await res.json();
      setSlot(data.slot);
      setInstructionsDraft(data.slot.pickupInstructions || '');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdmit = async (reservationId: string) => {
    try {
      const res = await fetch(`/api/operator/fresh-events/slots/${slot!.id}/admit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationIds: [reservationId] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore');
      toast.success('Beneficiario ammesso, QR generato');
      fetchSlot();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAdmitAll = async () => {
    const waiting = (slot?.reservations || []).filter((r) => r.status === 'WAITING');
    if (waiting.length === 0) return;
    const slots = slot!.capacity - slot!.reservedCount;
    const toAdmit = waiting.slice(0, slots).map((r) => r.id);
    try {
      const res = await fetch(`/api/operator/fresh-events/slots/${slot!.id}/admit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationIds: toAdmit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore');
      toast.success(`${data.admittedCount} ammessi, QR generati`);
      fetchSlot();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleNoShow = async (reservationId: string) => {
    if (!confirm('Confermi no-show? Sara conteggiato come warning.')) return;
    try {
      const res = await fetch(`/api/operator/fresh-events/reservation/${reservationId}/no-show`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore');
      if (data.suspended) {
        toast.warning('No-show registrato. Beneficiario sospeso per 30gg.');
      } else {
        toast.success(`No-show registrato. Warning: ${data.warnings}/${data.threshold}`);
      }
      fetchSlot();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleScan = async () => {
    if (!scanInput.trim()) return;
    setScanResult(null);
    try {
      const res = await fetch(`/api/operator/fresh-events/slots/${slot!.id}/scan-pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: scanInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore');
      setScanResult({ ok: true, message: `Ritiro registrato per ${data.beneficiaryName}` });
      setScanInput('');
      fetchSlot();
    } catch (err: any) {
      setScanResult({ ok: false, message: err.message });
    }
  };

  const handleSaveInstructions = async () => {
    try {
      const res = await fetch(`/api/operator/fresh-events/slots/${slot!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupInstructions: instructionsDraft }),
      });
      if (!res.ok) throw new Error('Errore');
      toast.success('Istruzioni aggiornate');
      setEditingInstructions(false);
      fetchSlot();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleStatus = async (newStatus: 'CLOSED' | 'COMPLETED' | 'CANCELLED') => {
    if (!confirm(`Confermi transizione a ${newStatus}?`)) return;
    try {
      const res = await fetch(`/api/operator/fresh-events/slots/${slot!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Errore');
      toast.success(`Slot ${newStatus.toLowerCase()}`);
      fetchSlot();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!slot) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Alert type="error">Slot non trovato</Alert>
      </div>
    );
  }

  const slotBadge = slotStatusBadge(slot.status);
  const confirmed = slot.reservations.filter((r) => ['CONFIRMED', 'ADMITTED', 'PICKED_UP'].includes(r.status));
  const waiting = slot.reservations.filter((r) => r.status === 'WAITING');
  const problematic = slot.reservations.filter((r) => ['NO_SHOW', 'CANCELLED', 'EXPIRED'].includes(r.status));
  const freeSlots = slot.capacity - slot.reservedCount;

  const now = new Date();
  const isPast = new Date(slot.scheduledEnd) < now;

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      <Link href={`/operator/fresh-events/templates/${slot.template.id}`} className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Torna al template
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Apple className="h-5 w-5 text-green-600" aria-hidden="true" />
                <CardTitle>{slot.template.title}</CardTitle>
              </div>
              <div className="mt-2 space-y-1 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span>{new Date(slot.scheduledStart).toLocaleString('it-IT', { dateStyle: 'full', timeStyle: 'short' })}</span>
                </div>
                {slot.pickupLocation && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    <span>{slot.pickupLocation.address}, {slot.pickupLocation.city}</span>
                  </div>
                )}
              </div>
            </div>
            <Badge variant={slotBadge.variant}>{slotBadge.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-xs text-gray-500">Capacita</div>
              <div className="font-semibold">{slot.capacity}</div>
            </div>
            <div className="bg-green-50 p-2 rounded">
              <div className="text-xs text-green-700">Prenotati</div>
              <div className="font-semibold text-green-700">{slot.reservedCount}</div>
            </div>
            <div className="bg-amber-50 p-2 rounded">
              <div className="text-xs text-amber-700">In lista</div>
              <div className="font-semibold text-amber-700">{slot.waitingCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(slot.status === 'PUBLISHED' || slot.status === 'FULL') && !isPast && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="h-4 w-4" aria-hidden="true" />
              Scansione QR al ritiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Incolla codice QR..."
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              />
              <Button onClick={handleScan} variant="primary">Scansiona</Button>
            </div>
            {scanResult && (
              <Alert type={scanResult.ok ? 'success' : 'error'}>
                <div className="flex items-center gap-2">
                  {scanResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  {scanResult.message}
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Istruzioni di ritiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {editingInstructions ? (
            <>
              <Textarea
                value={instructionsDraft}
                onChange={(e) => setInstructionsDraft(e.target.value)}
                rows={3}
                maxLength={2000}
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveInstructions} variant="primary" size="sm">
                  <Save className="h-4 w-4 mr-1" aria-hidden="true" />
                  Salva
                </Button>
                <Button onClick={() => { setEditingInstructions(false); setInstructionsDraft(slot.pickupInstructions || ''); }} variant="secondary" size="sm">
                  Annulla
                </Button>
              </div>
            </>
          ) : (
            <>
              {slot.pickupInstructions ? (
                <p className="text-sm">{slot.pickupInstructions}</p>
              ) : (
                <p className="text-sm text-gray-500 italic">Nessuna istruzione</p>
              )}
              <Button onClick={() => setEditingInstructions(true)} variant="ghost" size="sm">
                Modifica istruzioni
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {confirmed.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600" aria-hidden="true" />
            Prenotati ({confirmed.length})
          </h2>
          <div className="grid gap-2">
            {confirmed.map((r) => {
              const badge = reservationStatusBadge(r.status);
              const displayName = r.beneficiary.nickname || `${r.beneficiary.firstName} ${r.beneficiary.lastName.charAt(0)}.`;
              return (
                <Card key={r.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-medium">{displayName}</div>
                        <div className="text-xs text-gray-500">
                          Prenotato {new Date(r.reservedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                          {r.pickedUpAt && ` - ritirato ${new Date(r.pickedUpAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        {r.status === 'CONFIRMED' && !isPast && (
                          <Button onClick={() => handleNoShow(r.id)} size="sm" variant="danger">
                            <UserX className="h-3 w-3 mr-1" aria-hidden="true" />
                            No-show
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {waiting.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-600" aria-hidden="true" />
              Lista d&apos;attesa ({waiting.length})
            </h2>
            {freeSlots > 0 && (
              <Button onClick={handleAdmitAll} size="sm" variant="primary">
                Ammetti primi {Math.min(freeSlots, waiting.length)}
              </Button>
            )}
          </div>
          {freeSlots === 0 && (
            <Alert type="info">Tutti i posti sono occupati. Libera un posto per ammettere dalla lista.</Alert>
          )}
          <div className="grid gap-2">
            {waiting.map((r) => {
              const displayName = r.beneficiary.nickname || `${r.beneficiary.firstName} ${r.beneficiary.lastName.charAt(0)}.`;
              return (
                <Card key={r.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">#{r.position} {displayName}</div>
                        <div className="text-xs text-gray-500">
                          Iscritto {new Date(r.reservedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                        </div>
                      </div>
                      {freeSlots > 0 && (
                        <Button onClick={() => handleAdmit(r.id)} size="sm" variant="primary">
                          <UserCheck className="h-3 w-3 mr-1" aria-hidden="true" />
                          Ammetti
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {problematic.length > 0 && <SectionDivider label="Storico" count={problematic.length} color="info" />}
      {problematic.length > 0 && (
        <section>
          <div className="grid gap-2">
            {problematic.map((r) => {
              const badge = reservationStatusBadge(r.status);
              const displayName = r.beneficiary.nickname || `${r.beneficiary.firstName} ${r.beneficiary.lastName.charAt(0)}.`;
              return (
                <Card key={r.id} className="opacity-70">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{displayName}</span>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {slot.reservations.length === 0 && (
        <EmptyState
          title="Nessuna prenotazione"
          description="I beneficiari potranno prenotare questo slot una volta notificati."
        />
      )}

      {(slot.status === 'PUBLISHED' || slot.status === 'FULL') && (
        <div className="flex gap-2 pt-4 border-t">
          {slot.status === 'PUBLISHED' && (
            <Button onClick={() => handleStatus('CLOSED')} variant="secondary">
              Chiudi prenotazioni
            </Button>
          )}
          {isPast && (
            <Button onClick={() => handleStatus('COMPLETED')} variant="primary">
              Segna come concluso
            </Button>
          )}
          <Button onClick={() => handleStatus('CANCELLED')} variant="danger">
            Annulla slot
          </Button>
        </div>
      )}
    </div>
  );
}
