'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OPERATOR_ROLE_LABELS, OPERATOR_PERMISSION_LABELS, OperatorRole, OperatorPermission } from '@/types';

interface Operator {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: OperatorRole;
  permissions: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const ROLE_OPTIONS: { value: OperatorRole; label: string }[] = [
  { value: 'ADMIN', label: 'Amministratore' },
  { value: 'GESTORE_RICHIESTE', label: 'Gestore Richieste' },
  { value: 'GESTORE_OGGETTI', label: 'Gestore Oggetti' },
  { value: 'GESTORE_VOLONTARI', label: 'Gestore Volontari' },
  { value: 'OPERATORE', label: 'Operatore' },
];

const PERMISSION_OPTIONS: { value: OperatorPermission; label: string }[] = [
  { value: 'RECIPIENT_AUTHORIZE', label: 'Abilitare utenti Riceventi' },
  { value: 'OBJECT_RECEIVE', label: 'Gestione entrata oggetti' },
  { value: 'OBJECT_DELIVER', label: 'Consegna oggetti al destinatario' },
  { value: 'VOLUNTEER_MANAGE', label: 'Organizzazione volontari' },
  { value: 'REQUEST_PROXY', label: 'Fare richieste per conto di utenti' },
  { value: 'ORGANIZATION_ADMIN', label: 'Amministrazione Ente' },
];

export default function OperatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [operator, setOperator] = useState<Operator | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'OPERATORE' as OperatorRole,
    permissions: [] as string[],
  });

  useEffect(() => {
    fetchOperator();
  }, [id]);

  const fetchOperator = async () => {
    try {
      const res = await fetch(`/api/operator/operators/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOperator(data.operator);
        setForm({
          firstName: data.operator.firstName || '',
          lastName: data.operator.lastName || '',
          email: data.operator.email || '',
          phone: data.operator.phone || '',
          role: data.operator.role,
          permissions: data.operator.permissions || [],
        });
      } else {
        const err = await res.json();
        setError(err.error || 'Errore');
      }
    } catch (err) {
      setError('Errore di rete');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/operator/operators/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email || null,
          phone: form.phone || null,
          role: form.role,
          permissions: form.permissions,
        }),
      });

      if (res.ok) {
        setSuccess('Dati salvati con successo');
        setOperator((prev) => prev ? { ...prev, ...form } : null);
      } else {
        const err = await res.json();
        setError(err.error || 'Errore durante il salvataggio');
      }
    } catch (err) {
      setError('Errore di rete');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    setResetting(true);
    setError(null);
    setTempPassword(null);

    try {
      const res = await fetch(`/api/operator/operators/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorId: id }),
      });

      if (res.ok) {
        const data = await res.json();
        setTempPassword(data.temporaryPassword);
      } else {
        const err = await res.json();
        setError(err.error || 'Errore durante il reset');
      }
    } catch (err) {
      setError('Errore di rete');
    } finally {
      setResetting(false);
    }
  };

  const togglePermission = (perm: OperatorPermission) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Operatore non trovato'}</p>
          <Link href="/operator/operators" className="text-primary-600 hover:underline">
            ← Torna alla lista
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/operator/operators" className="text-sm text-gray-500 hover:text-primary-600 mb-2 inline-flex items-center gap-1">
            ← Torna alla lista
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{operator.firstName} {operator.lastName}</h1>
          <p className="text-gray-500">@{operator.username}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          operator.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {operator.active ? 'Attivo' : 'Disattivato'}
        </span>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {tempPassword && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <p className="font-medium text-amber-800 mb-2">Password temporanea generata:</p>
          <p className="text-2xl font-mono text-amber-900">{tempPassword}</p>
          <p className="text-amber-600 mt-2">Comunicala all'operatore e chiedigli di cambiarla al primo accesso.</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Anagrafica</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm(prev => ({ ...prev, firstName: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cognome *</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm(prev => ({ ...prev, lastName: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Ruolo e Permessi</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ruolo</label>
            <select
              value={form.role}
              onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value as OperatorRole }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              {ROLE_OPTIONS.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permessi specifici</label>
            <p className="text-sm text-gray-500 mb-3">
              I permessi specifici si aggiungono a quelli già concessi dal ruolo.
            </p>
            <div className="space-y-2">
              {PERMISSION_OPTIONS.map(perm => (
                <label key={perm.value} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(perm.value)}
                    onChange={() => togglePermission(perm.value)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{perm.label}</p>
                    <p className="text-xs text-gray-500">{perm.value}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
            >
              {saving ? 'Salvataggio...' : 'Salva modifiche'}
            </button>
          </div>
        </div>
      </form>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Reset Password</h2>
        <p className="text-sm text-gray-500 mb-4">
          Genera una password temporanea per questo operatore. La password sarà "cambiamisubito"
          e l'operatore dovra' cambiarla al primo accesso.
        </p>
        <button
          type="button"
          onClick={handleResetPassword}
          disabled={resetting}
          className="px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium disabled:opacity-50"
        >
          {resetting ? 'Generazione...' : 'Genera password temporanea'}
        </button>
      </div>
    </div>
  );
}
