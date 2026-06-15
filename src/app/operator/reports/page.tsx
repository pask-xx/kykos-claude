'use client';

import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/Toast';
import { Accordion, Badge, Button, EmptyState, Spinner } from '@/components/ui';
import { Package } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Report {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  object: {
    id: string;
    title: string;
    imageUrls: string[];
    status: string;
  };
  reporter: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Mappa Report.status → Badge variant KYKOS.
 * 4 stati: PENDING (warning), RESOLVED (success), DISMISSED (default), BLOCKED (danger).
 */
function reportStatusBadge(status: string) {
  switch (status) {
    case 'PENDING': return { variant: 'warning' as const, label: 'In attesa' };
    case 'RESOLVED': return { variant: 'success' as const, label: 'Risolta' };
    case 'DISMISSED': return { variant: 'default' as const, label: 'Scartata' };
    case 'BLOCKED': return { variant: 'danger' as const, label: 'Bloccata' };
    default: return { variant: 'default' as const, label: status };
  }
}

export default function OperatorReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/operator/reports');
      const data = await res.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Errore di rete');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reportId: string, action: 'resolve' | 'dismiss' | 'block_object') => {
    setProcessing(reportId);
    try {
      const res = await fetch('/api/operator/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Errore');
        return;
      }

      toast.success('Segnalazione aggiornata');
      fetchReports();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Errore di rete');
    } finally {
      setProcessing(null);
    }
  };

  const pendingReports = reports.filter(r => r.status === 'PENDING');
  const resolvedReports = reports.filter(r => r.status !== 'PENDING');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 overflow-x-hidden">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Segnalazioni</h1>
        <p className="text-gray-500">Gestisci le segnalazioni degli utenti</p>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          title="Nessuna segnalazione"
          description="Non ci sono segnalazioni da gestire al momento."
        />
      ) : (
        <div className="space-y-8">
          {/* Sezione "In attesa" - collassabile, defaultOpen (azioni richieste ora) */}
          {pendingReports.length > 0 && (
            <Accordion
              label="In attesa"
              count={pendingReports.length}
              color="warning"
              defaultOpen
            >
              {pendingReports.map((report) => {
                const badge = reportStatusBadge(report.status);
                return (
                  <div key={report.id} className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {report.object.imageUrls && report.object.imageUrls[0] ? (
                          <img
                            src={report.object.imageUrls[0]}
                            alt={report.object.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" aria-hidden="true" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {report.object.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Segnalato il {formatDate(report.createdAt)} da {report.reporter.name}
                            </p>
                          </div>
                          <Badge variant={badge.variant} className="flex-shrink-0">{badge.label}</Badge>
                        </div>
                        <div className="mt-2 p-3 bg-error-50 rounded-lg border border-error-100">
                          <p className="text-sm text-error-700">
                            <strong>Motivo:</strong> {report.reason}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                          <Button
                            variant="success"
                            size="sm"
                            loading={processing === report.id}
                            onClick={() => handleAction(report.id, 'resolve')}
                          >
                            Segna come risolta
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            loading={processing === report.id}
                            onClick={() => handleAction(report.id, 'block_object')}
                          >
                            Blocca oggetto
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={processing === report.id}
                            onClick={() => handleAction(report.id, 'dismiss')}
                          >
                            Scarta
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Accordion>
          )}

          {/* Sezione "Risolte" - collassabile, defaultOpen (history visibile subito) */}
          {resolvedReports.length > 0 && (
            <Accordion
              label="Risolte"
              count={resolvedReports.length}
              color="success"
              defaultOpen
            >
              {resolvedReports.map((report) => {
                const badge = reportStatusBadge(report.status);
                return (
                  <div key={report.id} className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {report.object.imageUrls && report.object.imageUrls[0] ? (
                          <img
                            src={report.object.imageUrls[0]}
                            alt={report.object.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" aria-hidden="true" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {report.object.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Segnalato il {formatDate(report.createdAt)} da {report.reporter.name}
                            </p>
                          </div>
                          <Badge variant={badge.variant} className="flex-shrink-0">{badge.label}</Badge>
                        </div>
                        <div className="mt-2 p-3 bg-error-50 rounded-lg border border-error-100">
                          <p className="text-sm text-error-700">
                            <strong>Motivo:</strong> {report.reason}
                          </p>
                        </div>
                        {/* Nessuna azione: segnalazione già gestita */}
                      </div>
                    </div>
                  </div>
                );
              })}
            </Accordion>
          )}
        </div>
      )}
    </div>
  );
}
