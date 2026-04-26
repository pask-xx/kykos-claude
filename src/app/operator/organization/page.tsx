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
  autoApproveGoodsRequests: boolean;
  autoApproveServicesRequests: boolean;
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
  const [autoApproveGoodsRequests, setAutoApproveGoodsRequests] = useState(true);
  const [autoApproveServicesRequests, setAutoApproveServicesRequests] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // First fetch operator session
      const opRes = await fetch('/api/operator/me');
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
          setAutoApproveGoodsRequests(orgData.organization.autoApproveGoodsRequests ?? true);
          setAutoApproveServicesRequests(orgData.organization.autoApproveServicesRequests ?? false);
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
          autoApproveGoodsRequests,
          autoApproveServicesRequests,
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

  const handleAutoApproveToggle = async (field: string, checked: boolean) => {
    if (field === 'autoApproveRequests') setAutoApproveRequests(checked);
    if (field === 'autoApproveGoodsRequests') setAutoApproveGoodsRequests(checked);
    if (field === 'autoApproveServicesRequests') setAutoApproveServicesRequests(checked);

    setSaving(true);

    try {
      const res = await fetch('/api/operator/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: checked }),
      });

      if (res.ok) {
        const labels: Record<string, string> = {
          autoApproveRequests: 'Oggetti',
          autoApproveGoodsRequests: 'Beni',
          autoApproveServicesRequests: 'Servizi',
        };
        setSuccess(`${labels[field]}: ${checked ? 'Approvazione automatica attivata' : 'disattivata'}`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        if (field === 'autoApproveRequests') setAutoApproveRequests(!checked);
        if (field === 'autoApproveGoodsRequests') setAutoApproveGoodsRequests(!checked);
        if (field === 'autoApproveServicesRequests') setAutoApproveServicesRequests(!checked);
        const data = await res.json();
        setError(data.error || 'Errore');
      }
    } catch (err) {
      if (field === 'autoApproveRequests') setAutoApproveRequests(!checked);
      if (field === 'autoApproveGoodsRequests') setAutoApproveGoodsRequests(!checked);
      if (field === 'autoApproveServicesRequests') setAutoApproveServicesRequests(!checked);
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
          <span>⚙️</span> Approvazione automatica richieste
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Configura se le richieste vengono approvate automaticamente senza intervento dell&apos;operatore.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">📦 Oggetti</p>
              <p className="text-sm text-gray-500">Richieste di oggetti pubblicati da donatori</p>
            </div>
            <button
              onClick={() => handleAutoApproveToggle('autoApproveRequests', !autoApproveRequests)}
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

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">🪑 Beni</p>
              <p className="text-sm text-gray-500">Richieste di beni da parte dei beneficiari</p>
            </div>
            <button
              onClick={() => handleAutoApproveToggle('autoApproveGoodsRequests', !autoApproveGoodsRequests)}
              disabled={saving}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autoApproveGoodsRequests ? 'bg-green-500' : 'bg-gray-300'
              } disabled:opacity-50`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  autoApproveGoodsRequests ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">🔧 Servizi</p>
              <p className="text-sm text-gray-500">Richieste di servizi da parte dei beneficiari</p>
            </div>
            <button
              onClick={() => handleAutoApproveToggle('autoApproveServicesRequests', !autoApproveServicesRequests)}
              disabled={saving}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autoApproveServicesRequests ? 'bg-green-500' : 'bg-gray-300'
              } disabled:opacity-50`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  autoApproveServicesRequests ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
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
