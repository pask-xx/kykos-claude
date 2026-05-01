'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

interface Organization {
  id: string;
  name: string;
  type: string;
  verified: boolean;
  user: {
    email: string;
    createdAt: string;
  };
  _count: {
    objects: number;
    requests: number;
  };
}

interface AdesioneEnte {
  id: string;
  denominazione: string;
  nomeReferente: string;
  cognomeReferente: string;
  telefono: string;
  email: string;
  indirizzo: string;
  civico: string;
  cap: string;
  citta: string;
  nota: string | null;
  website: string | null;
  status: string;
  emailConfirmed: boolean;
  createdAt: string;
}

const ORG_TYPE_LABELS: Record<string, string> = {
  CHARITY: 'Centro Caritas',
  CHURCH: 'Parrocchia',
  ASSOCIATION: 'Associazione',
};

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const [intermediaries, setIntermediaries] = useState<Organization[]>([]);
  const [adesioni, setAdesioni] = useState<AdesioneEnte[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'enti' | 'adesioni'>('enti');

  useEffect(() => {
    if (searchParams.get('created') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } else if (searchParams.get('verified') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/intermediaries').then(res => res.json()),
      fetch('/api/adesione').then(res => res.json()),
    ])
      .then(([intermediariesData, adesioniData]) => {
        setIntermediaries(intermediariesData.intermediaries || []);
        setAdesioni(adesioniData.requests || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, []);

  const verifiedCount = intermediaries.filter(i => i.verified).length;
  const pendingCount = intermediaries.filter(i => !i.verified).length;
  const pendingAdesioni = adesioni.filter(a => a.status === 'PENDING').length;
  const unconfirmedCount = adesioni.filter(a => a.status === 'PENDING' && !a.emailConfirmed).length;

  const handleAdesioneAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/adesione?id=${id}&action=${action}`, { method: 'PATCH' });
      if (res.ok) {
        const data = await fetch('/api/adesione').then(r => r.json());
        setAdesioni(data.requests || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div>
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-3">
          <span className="text-xl">✅</span>
          <p><strong>Operazione completata!</strong> L&apos;ente è stato creato e può ora accedere alla piattaforma.</p>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Enti verificati</p>
              <p className="text-2xl font-bold text-gray-900">{verifiedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Enti da verificare</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border cursor-pointer hover:bg-gray-50" onClick={() => setActiveTab('adesioni')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Richieste adesione</p>
              <p className="text-2xl font-bold text-gray-900">{pendingAdesioni}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Totale enti</p>
              <p className="text-2xl font-bold text-gray-900">{intermediaries.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('enti')}
          className={`pb-3 px-2 font-medium transition flex items-center gap-2 ${
            activeTab === 'enti'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Gestione Enti
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('adesioni')}
          className={`pb-3 px-2 font-medium transition flex items-center gap-2 ${
            activeTab === 'adesioni'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Richieste Adesione
          {pendingAdesioni > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {pendingAdesioni}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'enti' ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Gestione Enti</h2>

          {loading ? (
            <p className="text-gray-500 text-center py-8">Caricamento...</p>
          ) : intermediaries.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nessun ente registrato</p>
          ) : (
            <div className="space-y-4">
              {intermediaries.map((org) => (
                <Link
                  key={org.id}
                  href={`/admin/intermediaries/${org.id}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{org.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded ${
                        org.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {org.verified ? 'Verificato' : 'In attesa'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {ORG_TYPE_LABELS[org.type] || org.type} • {org.user.email}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Registrato il {new Date(org.user.createdAt).toLocaleDateString('it-IT')}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>📦 {org._count.objects} oggetti</span>
                      <span>📋 {org._count.requests} richieste</span>
                    </div>
                  </div>
                  {!org.verified && (
                    <form
                      action={`/api/admin/intermediaries/${org.id}/verify`}
                      method="POST"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                      >
                        Approva
                      </button>
                    </form>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Richieste di Adesione</h2>

          {loading ? (
            <p className="text-gray-500 text-center py-8">Caricamento...</p>
          ) : adesioni.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nessuna richiesta di adesione</p>
          ) : (
            <div className="space-y-4">
              {adesioni.map((adesione) => (
                <div
                  key={adesione.id}
                  className={`p-4 rounded-lg border ${
                    adesione.status === 'PENDING'
                      ? !adesione.emailConfirmed
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-amber-50 border-amber-200'
                      : adesione.status === 'APPROVED'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{adesione.denominazione}</h3>
                        <span className={`px-2 py-1 text-xs rounded ${
                          adesione.status === 'PENDING'
                            ? !adesione.emailConfirmed
                              ? 'bg-gray-200 text-gray-600'
                              : 'bg-amber-100 text-amber-700'
                            : adesione.status === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {adesione.status === 'PENDING' && !adesione.emailConfirmed
                            ? 'In attesa conferma'
                            : adesione.status === 'PENDING'
                            ? 'In attesa'
                            : adesione.status === 'APPROVED'
                            ? 'Approvata'
                            : 'Rifiutata'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Referente:</strong> {adesione.nomeReferente} {adesione.cognomeReferente}</p>
                        <p><strong>Email:</strong> {adesione.email}</p>
                        <p><strong>Telefono:</strong> {adesione.telefono}</p>
                        <p><strong>Indirizzo:</strong> {adesione.indirizzo}, {adesione.civico} - {adesione.cap} {adesione.citta}</p>
                        {adesione.website && <p><strong>Sito web:</strong> {adesione.website}</p>}
                        {adesione.nota && <p><strong>Nota:</strong> {adesione.nota}</p>}
                        {adesione.status === 'PENDING' && !adesione.emailConfirmed && (
                          <p className="text-amber-600"><strong>⚠️ Email non confermata</strong> - L'ente deve cliccare il link nella email ricevuta</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Richiesta del {new Date(adesione.createdAt).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    {adesione.status === 'PENDING' && adesione.emailConfirmed && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleAdesioneAction(adesione.id, 'approve')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                        >
                          Approva
                        </button>
                        <button
                          onClick={() => handleAdesioneAction(adesione.id, 'reject')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                        >
                          Rifiuta
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-gray-500">Caricamento...</p>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pannello Amministratore</h1>
      <Suspense fallback={<LoadingFallback />}>
        <AdminDashboardContent />
      </Suspense>
    </div>
  );
}