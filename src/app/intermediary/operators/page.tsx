'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
}

export default function IntermediaryOperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newOp, setNewOp] = useState({
    firstName: '',
    lastName: '',
    notifyEmail: '',
    role: 'OPERATORE' as OperatorRole,
    permissions: [] as string[],
  });
  const [createdOp, setCreatedOp] = useState<{ operator: Operator; tempPassword: string; emailSent: boolean } | null>(null);

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const res = await fetch('/api/operator/operators');
      if (res.ok) {
        const data = await res.json();
        setOperators(data.operators || []);
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

  const toggleActive = async (operatorId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/operator/${operatorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (res.ok) {
        setOperators(prev =>
          prev.map(op => op.id === operatorId ? { ...op, active: !currentActive } : op)
        );
      }
    } catch (err) {
      console.error('Toggle active error:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/operator/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: newOp.firstName,
          lastName: newOp.lastName,
          notifyEmail: newOp.notifyEmail || null,
          role: newOp.role,
          permissions: newOp.permissions,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedOp(data);
        setNewOp({
          firstName: '',
          lastName: '',
          notifyEmail: '',
          role: 'OPERATORE',
          permissions: [],
        });
        fetchOperators();
      } else {
        const err = await res.json();
        setError(err.error || 'Errore durante la creazione');
      }
    } catch (err) {
      setError('Errore di rete');
    } finally {
      setCreating(false);
    }
  };

  const togglePermission = (perm: OperatorPermission) => {
    setNewOp(prev => ({
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operatori</h1>
          <p className="text-gray-500">{operators.length} operatori</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm"
        >
          + Nuovo operatore
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operatore</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contatti</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ruolo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {operators.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Nessun operatore presente
                </td>
              </tr>
            ) : (
              operators.map((op) => (
                <tr key={op.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{op.firstName} {op.lastName}</div>
                    <div className="text-sm text-gray-500">@{op.username}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {op.email && <div className="text-gray-700">{op.email}</div>}
                    {op.phone && <div className="text-gray-500">{op.phone}</div>}
                    {!op.email && !op.phone && <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded">
                      {OPERATOR_ROLE_LABELS[op.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${
                      op.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {op.active ? 'Attivo' : 'Disattivato'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/intermediary/operators/${op.id}`}
                        className="px-3 py-1.5 text-sm bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                      >
                        Dettagli
                      </Link>
                      <button
                        onClick={() => toggleActive(op.id, op.active)}
                        className={`px-3 py-1.5 text-sm rounded ${
                          op.active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {op.active ? 'Disattiva' : 'Attiva'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Nuovo operatore</h3>
                <button
                  onClick={() => { setShowCreateModal(false); setCreatedOp(null); setError(null); }}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {createdOp ? (
                <div>
                  <p className="text-green-700 font-medium mb-2">✓ Operatore creato con successo!</p>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                    <p className="font-medium text-amber-800 mb-1">Username:</p>
                    <p className="text-2xl font-mono text-amber-900">{createdOp.operator.username}</p>
                    <p className="font-medium text-amber-800 mt-3 mb-1">Password temporanea:</p>
                    <p className="text-2xl font-mono text-amber-900">{createdOp.tempPassword}</p>
                  </div>
                  {createdOp.emailSent ? (
                    <p className="text-sm text-green-600 mb-4">
                      ✓ Credenziali inviate per email a {createdOp.operator.email}
                    </p>
                  ) : (
                    <p className="text-sm text-amber-600 mb-4">
                      ⚠ Email non inviata. Comunica le credenziali manualmente all'operatore.
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mb-4">
                    Chiedi all'operatore di cambiare la password al primo accesso.
                  </p>
                  <button
                    onClick={() => { setShowCreateModal(false); setCreatedOp(null); }}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                  >
                    Chiudi
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreate}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                        <input
                          type="text"
                          value={newOp.firstName}
                          onChange={(e) => setNewOp(prev => ({ ...prev, firstName: e.target.value }))}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cognome *</label>
                        <input
                          type="text"
                          value={newOp.lastName}
                          onChange={(e) => setNewOp(prev => ({ ...prev, lastName: e.target.value }))}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email per notifiche *</label>
                      <input
                        type="email"
                        value={newOp.notifyEmail}
                        onChange={(e) => setNewOp(prev => ({ ...prev, notifyEmail: e.target.value }))}
                        required
                        placeholder="email@ente.it"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo *</label>
                      <select
                        value={newOp.role}
                        onChange={(e) => setNewOp(prev => ({ ...prev, role: e.target.value as OperatorRole }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="ADMIN">Amministratore</option>
                        <option value="GESTORE_RICHIESTE">Gestore Richieste</option>
                        <option value="GESTORE_OGGETTI">Gestore Oggetti</option>
                        <option value="GESTORE_VOLONTARI">Gestore Volontari</option>
                        <option value="OPERATORE">Operatore</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Permessi aggiuntivi</label>
                      <div className="space-y-2 max-h-40 overflow-auto">
                        {Object.entries(OPERATOR_PERMISSION_LABELS).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={newOp.permissions.includes(key)}
                              onChange={() => togglePermission(key as OperatorPermission)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <p className="mt-3 text-sm text-red-600">{error}</p>
                  )}

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowCreateModal(false); setError(null); }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
                    >
                      {creating ? 'Creazione...' : 'Crea operatore'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
