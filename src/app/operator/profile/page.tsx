'use client';

import { useState, useEffect } from 'react';
import { OPERATOR_ROLE_LABELS } from '@/types';
import OperatorPasswordChangeForm from '@/components/operator/OperatorPasswordChangeForm';

interface OperatorData {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: string;
  organization: {
    id: string;
    name: string;
    type: string;
    code: string;
  };
}

export default function OperatorProfilePage() {
  const [operator, setOperator] = useState<OperatorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/operator/me');
      const data = await res.json();
      if (data.operator) {
        setOperator(data.operator);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Profilo non trovato</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Il mio profilo</h1>
        <p className="text-gray-500">Informazioni personali e dell&apos;organizzazione</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">👤</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {operator.firstName} {operator.lastName}
            </h2>
            <p className="text-gray-500">@{operator.username}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Ruolo</p>
            <p className="font-medium text-gray-900">
              {OPERATOR_ROLE_LABELS[operator.role as keyof typeof OPERATOR_ROLE_LABELS] || operator.role}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Email</p>
            <p className="font-medium text-gray-900">{operator.email || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Telefono</p>
            <p className="font-medium text-gray-900">{operator.phone || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Username</p>
            <p className="font-medium text-gray-900">{operator.username}</p>
          </div>
        </div>
      </div>

      {/* Organization Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ente di appartenenza</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Nome</p>
            <p className="font-medium text-gray-900">{operator.organization.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Tipo</p>
            <p className="font-medium text-gray-900">{operator.organization.type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Codice Ente</p>
            <p className="font-medium text-gray-900">{operator.organization.code}</p>
          </div>
        </div>
      </div>

      {/* Password Change */}
      <OperatorPasswordChangeForm />
    </div>
  );
}
