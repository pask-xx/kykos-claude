'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProfileForm from '@/components/profile/ProfileForm';

interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  fiscalCode: string;
  birthDate: string;
  address: string;
  houseNumber: string;
  city: string;
  cap: string;
  intermediaryOrg: {
    id: string;
    name: string;
    type: string;
    verified: boolean;
  };
}

export default function IntermediaryProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">
          Sessione non trovata.{' '}
          <Link href="/auth/login" className="text-primary-600 hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl p-6">
      <h1 className="text-3xl font-medium text-gray-900 mb-8 text-center">Il mio profilo</h1>

      {/* Editable Form */}
      <div className="mb-8">
        <ProfileForm user={user} role="INTERMEDIARY" />
      </div>

      {/* Organization Data (read-only) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>🏢</span> Dati organizzazione
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Nome organizzazione</p>
            <p className="font-medium text-gray-900">{user.intermediaryOrg?.name || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Tipo</p>
            <p className="font-medium text-gray-900">{user.intermediaryOrg?.type || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Stato verifica</p>
            <p className={`font-medium ${user.intermediaryOrg?.verified ? 'text-green-600' : 'text-yellow-600'}`}>
              {user.intermediaryOrg?.verified ? 'Verificato' : 'In verifica'}
            </p>
          </div>
        </div>
      </div>

      {/* Account info */}
      <div className="bg-gray-50 p-6 rounded-xl border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Informazioni account</h2>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-sm text-gray-500 mb-1">ID Utente</p>
            <p className="font-medium text-gray-900 font-mono">{user.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
