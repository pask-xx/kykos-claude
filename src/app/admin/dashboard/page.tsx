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

const ORG_TYPE_LABELS: Record<string, string> = {
  CHARITY: 'Centro Caritas',
  CHURCH: 'Parrocchia',
  ASSOCIATION: 'Associazione',
};

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const [intermediaries, setIntermediaries] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

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
    fetch('/api/admin/intermediaries')
      .then(res => res.json())
      .then(data => {
        setIntermediaries(data.intermediaries || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, []);

  const verifiedCount = intermediaries.filter(i => i.verified).length;
  const pendingCount = intermediaries.filter(i => !i.verified).length;

  return (
    <div>
      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-3">
          <span className="text-xl">✅</span>
          <p><strong>Operazione completata!</strong> L&apos;ente è stato creato e può ora accedere alla piattaforma.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
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
              <p className="text-sm text-gray-500">In attesa</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
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

      {/* Intermediaries List */}
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
