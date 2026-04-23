'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
  isee: string;
  authorized: boolean;
  referenceEntity: { name: string } | null;
}

export default function RecipientProfilePage() {
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
    <div className="max-w-2xl">
      <h1 className="text-3xl font-medium text-gray-900 mb-8 text-center">Il mio profilo</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>👤</span> Dati anagrafici
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Nome completo</p>
            <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Email</p>
            <p className="font-medium text-gray-900">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Codice Fiscale</p>
            <p className="font-medium text-gray-900 uppercase">{user.fiscalCode || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Data di nascita</p>
            <p className="font-medium text-gray-900">
              {user.birthDate ? new Date(user.birthDate).toLocaleDateString('it-IT') : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Indirizzo</p>
            <p className="font-medium text-gray-900">
              {user.address ? `${user.address}, ${user.houseNumber || ''}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">CAP / Città</p>
            <p className="font-medium text-gray-900">
              {user.cap ? `${user.cap} ${user.city || ''}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Valore ISEE</p>
            <p className="font-medium text-gray-900">
              {user.isee ? `€${Number(user.isee).toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Ente di riferimento</p>
            <p className="font-medium text-gray-900">{user.referenceEntity?.name || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Stato autorizzazione</p>
            <p className={`font-medium ${user.authorized ? 'text-green-600' : 'text-yellow-600'}`}>
              {user.authorized ? 'Autorizzato' : 'In attesa di autorizzazione'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Informazioni account</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">ID Utente</p>
            <p className="font-medium text-gray-900 text-sm">{user.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
