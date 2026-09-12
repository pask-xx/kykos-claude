'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Apple, Plus, Calendar, Users, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, EmptyState, Spinner, SectionDivider } from '@/components/ui';
import { toast } from '@/components/ui/Toast';

interface Template {
  id: string;
  title: string;
  description: string | null;
  weekday: number;
  startTime: string;
  endTime: string;
  capacity: number;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  defaultLocation: { id: string; address: string; city: string } | null;
  _count: { subscriptions: number; slots: number };
}

const WEEKDAY_LABELS = ['Domenica', 'Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato'];

function templateStatusBadge(s: Template['status']) {
  switch (s) {
    case 'ACTIVE': return { variant: 'success' as const, label: 'Attivo' };
    case 'PAUSED': return { variant: 'warning' as const, label: 'In pausa' };
    case 'ARCHIVED': return { variant: 'default' as const, label: 'Archiviato' };
  }
}

export default function OperatorFreshEventsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/operator/fresh-events/templates');
      if (!res.ok) throw new Error('Errore');
      const data = await res.json();
      setTemplates(data.templates || []);
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

  const active = templates.filter((t) => t.status === 'ACTIVE');
  const archived = templates.filter((t) => t.status !== 'ACTIVE');

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Apple className="h-6 w-6 text-green-600" aria-hidden="true" />
          <h1 className="text-2xl font-bold">Prodotti Freschi</h1>
        </div>
        <Link href="/operator/fresh-events/new">
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
            Nuovo template
          </Button>
        </Link>
      </div>

      <p className="text-sm text-gray-600">
        I template definiscono le linee ricorrenti di distribuzione (es. &quot;ogni martedi pomeriggio&quot;).
        Da ogni template pubblichi gli slot specifici con data e capacita.
      </p>

      {active.length === 0 && archived.length === 0 && (
        <EmptyState
          title="Nessun template"
          description="Crea il primo template per iniziare a distribuire prodotti freschi."
          action={
            <Link href="/operator/fresh-events/new">
              <Button variant="primary">Crea template</Button>
            </Link>
          }
        />
      )}

      {active.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Template attivi</h2>
          <div className="grid gap-3">
            {active.map((t) => {
              const badge = templateStatusBadge(t.status);
              return (
                <Link key={t.id} href={`/operator/fresh-events/templates/${t.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{t.title}</CardTitle>
                          {t.description && <p className="text-sm text-gray-600 mt-1">{t.description}</p>}
                        </div>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="h-4 w-4" aria-hidden="true" />
                        <span>{WEEKDAY_LABELS[t.weekday]} {t.startTime}-{t.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users className="h-4 w-4" aria-hidden="true" />
                        <span>{t.capacity} posti per slot</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600 pt-2 border-t">
                        <span>{t._count.subscriptions} iscritti</span>
                        <span>{t._count.slots} slot futuri pubblicati</span>
                        <ChevronRight className="h-4 w-4 ml-auto" aria-hidden="true" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {archived.length > 0 && <SectionDivider label="Archiviati" count={archived.length} color="info" />}

      {archived.length > 0 && (
        <section>
          <div className="grid gap-3">
            {archived.map((t) => {
              const badge = templateStatusBadge(t.status);
              return (
                <Link key={t.id} href={`/operator/fresh-events/templates/${t.id}`}>
                  <Card className="opacity-70 hover:opacity-100 transition-opacity cursor-pointer">
                    <CardContent className="pt-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{t.title}</div>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {WEEKDAY_LABELS[t.weekday]} {t.startTime}-{t.endTime}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
