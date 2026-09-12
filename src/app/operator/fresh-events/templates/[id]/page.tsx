'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Apple, ArrowLeft, Plus, Calendar, Users, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, EmptyState, Spinner, SectionDivider, Alert } from '@/components/ui';
import { toast } from '@/components/ui/Toast';

interface Slot {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  capacity: number;
  reservedCount: number;
  waitingCount: number;
  status: 'PUBLISHED' | 'FULL' | 'CLOSED' | 'COMPLETED' | 'CANCELLED';
}

interface Template {
  id: string;
  title: string;
  description: string | null;
  weekday: number;
  startTime: string;
  endTime: string;
  capacity: number;
  defaultPickupInstructions: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  defaultLocation: { id: string; address: string; city: string } | null;
  _count: { subscriptions: number };
  slots: Slot[];
}

const WEEKDAY_LABELS = ['Domenica', 'Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato'];

function slotStatusBadge(s: Slot['status']) {
  switch (s) {
    case 'PUBLISHED': return { variant: 'success' as const, label: 'Aperto' };
    case 'FULL': return { variant: 'warning' as const, label: 'Pieno' };
    case 'CLOSED': return { variant: 'default' as const, label: 'Chiuso' };
    case 'COMPLETED': return { variant: 'default' as const, label: 'Concluso' };
    case 'CANCELLED': return { variant: 'danger' as const, label: 'Annullato' };
  }
}

export default function TemplateDetailPage() {
  const params = useParams<{ id: string }>();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplate();
  }, [params.id]);

  const fetchTemplate = async () => {
    try {
      const res = await fetch(`/api/operator/fresh-events/templates/${params.id}`);
      if (!res.ok) throw new Error('Errore');
      const data = await res.json();
      setTemplate(data.template);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Alert type="error">Template non trovato</Alert>
      </div>
    );
  }

  const futureSlots = template.slots.filter((s) => new Date(s.scheduledStart) > new Date());
  const pastSlots = template.slots.filter((s) => new Date(s.scheduledStart) <= new Date());

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      <Link href="/operator/fresh-events" className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Torna alla lista
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>{template.title}</CardTitle>
              {template.description && <p className="text-sm text-gray-600 mt-1">{template.description}</p>}
            </div>
            <Badge variant={template.status === 'ACTIVE' ? 'success' : 'default'}>{template.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span>{WEEKDAY_LABELS[template.weekday]} {template.startTime}-{template.endTime}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Users className="h-4 w-4" aria-hidden="true" />
            <span>{template.capacity} posti per slot</span>
          </div>
          {template._count.subscriptions > 0 && (
            <p className="text-xs text-gray-600">{template._count.subscriptions} beneficiari iscritti a questo template</p>
          )}
        </CardContent>
      </Card>

      {template.status === 'ACTIVE' && (
        <div className="flex justify-end">
          <Link href={`/operator/fresh-events/templates/${template.id}/slots/new`}>
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
              Pubblica nuovo slot
            </Button>
          </Link>
        </div>
      )}

      {futureSlots.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Slot futuri</h2>
          <div className="grid gap-3">
            {futureSlots.map((s) => {
              const badge = slotStatusBadge(s.status);
              return (
                <Link key={s.id} href={`/operator/fresh-events/slots/${s.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {new Date(s.scheduledStart).toLocaleDateString('it-IT', { dateStyle: 'full' })}
                          </div>
                          <div className="text-xs text-gray-600">
                            {new Date(s.scheduledStart).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            {new Date(s.scheduledEnd).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-xs text-gray-700 mt-1">
                            {s.reservedCount}/{s.capacity} prenotati
                            {s.waitingCount > 0 && `, ${s.waitingCount} in lista`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {pastSlots.length > 0 && <SectionDivider label="Storico" count={pastSlots.length} color="info" />}

      {pastSlots.length > 0 && (
        <section>
          <div className="grid gap-2">
            {pastSlots.slice(0, 20).map((s) => {
              const badge = slotStatusBadge(s.status);
              return (
                <Link key={s.id} href={`/operator/fresh-events/slots/${s.id}`}>
                  <Card className="opacity-70 hover:opacity-100 cursor-pointer">
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          {new Date(s.scheduledStart).toLocaleDateString('it-IT', { dateStyle: 'long' })}
                        </span>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {futureSlots.length === 0 && pastSlots.length === 0 && (
        <EmptyState
          title="Nessuno slot pubblicato"
          description="Pubblica il primo slot per iniziare le distribuzioni."
        />
      )}
    </div>
  );
}
