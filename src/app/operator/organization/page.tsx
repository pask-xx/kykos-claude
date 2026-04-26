'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/components/RichTextEditor';

interface OrganizationData {
  id: string;
  name: string;
  type: string;
  code: string;
  autoApproveRequests: boolean;
  hoursInfo: string | null;
}

export default function OrganizationSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [hoursInfo, setHoursInfo] = useState('');
  const [autoApproveRequests, setAutoApproveRequests] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // First fetch operator session
      const opRes = await fetch('/api/operator/session');
      if (!opRes.ok) {
        router.push('/operator/login');
        return;
      }

      const opData = await opRes.json();
      const op = opData.operator;

      // Check if operator has ADMIN role or ORGANIZATION_ADMIN permission
      const isAdmin = op.role === 'ADMIN' || op.permissions.includes('ORGANIZATION_ADMIN');
      if (!isAdmin) {
        router.push('/operator/dashboard');
        return;
      }

      // Fetch organization data
      const orgRes = await fetch('/api/operator/organization');
      if (orgRes.ok) {
        const orgData = await orgRes.json();
        if (orgData.organization) {
          setOrganization(orgData.organization);
          setHoursInfo(orgData.organization.hoursInfo || '');
          setAutoApproveRequests(orgData.organization.autoApproveRequests || false);
        }
      }
    } catch (err) {
      setError('Errore di rete');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/operator/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hoursInfo,
          autoApproveRequests,
        }),
      });

      if (res.ok) {
        setSuccess('Impostazioni salvate con successo');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Errore nel salvataggio');
      }
    } catch (err) {
      setError('Errore di rete');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoApproveToggle = async (checked: boolean) => {
    setAutoApproveRequests(checked);
    setSaving(true);

    try {
      const res = await fetch('/api/operator/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoApproveRequests: checked }),
      });

      if (res.ok) {
        setSuccess(checked ? 'Approvazione automatica attivata' : 'Approvazione automatica disattivata');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setAutoApproveRequests(!checked);
        const data = await res.json();
        setError(data.error || 'Errore');
      }
    } catch (err) {
      setAutoApproveRequests(!checked);
      setError('Errore di rete');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Accesso negato</p>
      </div>
    );
  }

  const orgTypeLabels: Record<string, string> = {
    CHARITY: 'Centro Caritas',
    CHURCH: 'Parrocchia',
    ASSOCIATION: 'Associazione',
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Impostazioni ente</h1>
        <p className="text-gray-500">Configura le opzioni dell&apos;organizzazione</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          ✓ {success}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informazioni ente</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Nome</p>
            <p className="font-medium text-gray-900">{organization.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tipo</p>
            <p className="font-medium text-gray-900">{orgTypeLabels[organization.type] || organization.type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Codice</p>
            <p className="font-medium text-gray-900">{organization.code}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <span>⚙️</span> Richieste beni e servizi
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Configura come vengono gestite le richieste di beni e servizi da parte dei beneficiari.
        </p>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Approvazione automatica</p>
            <p className="text-sm text-gray-500">
              Le richieste vengono approvate automaticamente senza intervento dell&apos;operatore
            </p>
          </div>
          <button
            onClick={() => handleAutoApproveToggle(!autoApproveRequests)}
            disabled={saving}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              autoApproveRequests ? 'bg-green-500' : 'bg-gray-300'
            } disabled:opacity-50`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                autoApproveRequests ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <span>🕐</span> Orari e informazioni
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Inserisci gli orari di apertura/chiusura dell&apos;ente e altre informazioni utili per chi deve consegnare o ritirare oggetti.
        </p>

        <RichTextEditor
          value={hoursInfo}
          onChange={setHoursInfo}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
        >
          {saving ? 'Salvataggio...' : 'Salva'}
        </button>
      </div>
    </div>
  );
}
