'use client';

import { useState, useEffect } from 'react';
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

export default function IntermediaryReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('PENDING');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/intermediary/reports');
      const data = await res.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reportId: string, action: 'resolve' | 'dismiss' | 'block_object') => {
    setProcessing(reportId);
    try {
      const res = await fetch('/api/intermediary/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action }),
      });

      if (res.ok) {
        fetchReports();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">In attesa</span>;
      case 'RESOLVED':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Risolta</span>;
      case 'DISMISSED':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Scartata</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{status}</span>;
    }
  };

  const filteredReports = reports.filter(r => filter === 'ALL' || r.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium text-gray-900">Segnalazioni</h1>
        <p className="text-gray-500">Gestisci le segnalazioni degli utenti</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-4">
        <button
          onClick={() => setFilter('PENDING')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
            filter === 'PENDING'
              ? 'bg-amber-100 text-amber-700 border border-amber-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          In attesa ({reports.filter(r => r.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setFilter('RESOLVED')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
            filter === 'RESOLVED'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Risolte ({reports.filter(r => r.status === 'RESOLVED').length})
        </button>
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
            filter === 'ALL'
              ? 'bg-gray-200 text-gray-800 border border-gray-400'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tutte ({reports.length})
        </button>
      </div>

      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <span className="text-5xl mb-4 block">📋</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessuna segnalazione</h2>
          <p className="text-gray-500">
            {filter === 'PENDING' ? 'Non ci sono segnalazioni da gestire.' : 'Non ci sono segnalazioni.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-white p-4 rounded-xl shadow-sm border-2 border-gray-200">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {report.object.imageUrls && report.object.imageUrls[0] ? (
                    <img
                      src={report.object.imageUrls[0]}
                      alt={report.object.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">📦</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{report.object.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Segnalato il {formatDate(report.createdAt)} da {report.reporter.name}
                      </p>
                      <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-sm text-red-700">
                          <strong>Motivo:</strong> {report.reason}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(report.status)}
                  </div>

                  {report.status === 'PENDING' && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleAction(report.id, 'resolve')}
                        disabled={processing === report.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50"
                      >
                        {processing === report.id ? 'Elaborazione...' : 'Segna come risolta'}
                      </button>
                      <button
                        onClick={() => handleAction(report.id, 'block_object')}
                        disabled={processing === report.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm disabled:opacity-50"
                      >
                        Blocca oggetto
                      </button>
                      <button
                        onClick={() => handleAction(report.id, 'dismiss')}
                        disabled={processing === report.id}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm disabled:opacity-50"
                      >
                        Scarta
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}