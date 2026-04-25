'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { OPERATOR_ROLE_LABELS, OperatorRole } from '@/types';

interface Operator {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: OperatorRole;
  active: boolean;
  createdAt: string;
}

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                        href={`/operator/operators/${op.id}`}
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
    </div>
  );
}
