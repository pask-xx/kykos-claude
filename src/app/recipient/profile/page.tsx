'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClipboardList, AlertTriangle } from 'lucide-react';
import ProfileForm from '@/components/profile/ProfileForm';
import PasswordChangeForm from '@/components/PasswordChangeForm';
import ProfilePhotoUploader from '@/components/ProfilePhotoUploader';

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
  profileImageUrl: string | null;
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
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-medium text-gray-900 mb-8">Il mio profilo</h1>

        {/* Profile Photo */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Foto profilo</h2>
          <ProfilePhotoUploader
            currentUrl={user.profileImageUrl}
            onUploadComplete={(url) => {
              setUser(prev => prev ? { ...prev, profileImageUrl: url } : null);
            }}
          />
        </div>

        {/* Editable Form */}
        <div className="mb-8">
          <ProfileForm user={user} role="RECIPIENT" />
        </div>

        {/* Read-only fields */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-gray-500" aria-hidden="true" /> Dati non modificabili
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Valore ISEE</p>
              <p className="font-medium text-gray-900">
                {user.isee ? `€${parseFloat(user.isee.toString()).toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Ente di riferimento</p>
              <p className="font-medium text-gray-900">{user.referenceEntity?.name || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Stato autorizzazione</p>
              <p className={`font-medium ${user.authorized ? 'text-success-600' : 'text-yellow-600'}`}>
                {user.authorized ? 'Autorizzato' : 'In attesa di autorizzazione'}
              </p>
            </div>
          </div>
        </div>

        {/* Account info */}
        <div className="bg-gray-50 p-6 rounded-xl border mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Informazioni account</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-sm text-gray-500 mb-1">ID Utente</p>
              <p className="font-medium text-gray-900 font-mono">{user.id}</p>
            </div>
          </div>
        </div>

        {/* Password Change */}
        <PasswordChangeForm role="user" />

        {/* Danger Zone */}
        <div className="bg-error-50 border border-error-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-error-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-error-600" aria-hidden="true" /> Zona pericolosa
          </h2>
          <p className="text-error-700 text-sm mb-4">
            Una volta disattivato, l&apos;account non potrà essere ripristinato.
          </p>
          <Link
            href="/recipient/deactivate"
            className="inline-flex items-center gap-2 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 font-medium text-sm"
          >
            Disattiva account
          </Link>
        </div>
      </main>
    </div>
  );
}