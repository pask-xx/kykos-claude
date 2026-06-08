'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Printer, Clock, Tag, FileText, ClipboardList } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import { Switch, toast } from '@/components/ui';

interface OrganizationData {
  id: string;
  name: string;
  type: string;
  code: string;
  autoApproveRequests: boolean;
  autoApproveGoodsRequests: boolean;
  autoApproveServicesRequests: boolean;
  hoursInfo: string | null;
  printLabel: boolean;
  labelSize: string;
}

export default function OrganizationSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [hoursInfo, setHoursInfo] = useState('');
  const [autoApproveRequests, setAutoApproveRequests] = useState(false);
  const [autoApproveGoodsRequests, setAutoApproveGoodsRequests] = useState(true);
  const [autoApproveServicesRequests, setAutoApproveServicesRequests] = useState(false);
  const [printLabel, setPrintLabel] = useState(false);
  const [labelSize, setLabelSize] = useState('50x30');

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
          setPrintLabel(orgData.organization.printLabel ?? false);
          setLabelSize(orgData.organization.labelSize ?? '50x30');
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

    try {
      const res = await fetch('/api/operator/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hoursInfo,
          autoApproveRequests,
          autoApproveGoodsRequests,
          autoApproveServicesRequests,
          printLabel,
          labelSize,
        }),
      });

      if (res.ok) {
        toast.success('Impostazioni salvate con successo');
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
          autoApproveRequests: 'Disponibilità',
          autoApproveGoodsRequests: 'Richieste di beni',
          autoApproveServicesRequests: 'Richieste di servizi',
        };
        toast.success(`${labels[field]}: ${checked ? 'Approvazione automatica attivata' : 'disattivata'}`);
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

  const handlePrintLabelToggle = async (checked: boolean) => {
    setPrintLabel(checked);
    setSaving(true);

    try {
      const res = await fetch('/api/operator/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printLabel: checked }),
      });

      if (res.ok) {
        toast.success(`Stampa etichetta: ${checked ? 'attivata' : 'disattivata'}`);
      } else {
        setPrintLabel(!checked);
        const data = await res.json();
        setError(data.error || 'Errore');
      }
    } catch (err) {
      setPrintLabel(!checked);
      setError('Errore di rete');
    } finally {
      setSaving(false);
    }
  };

  const handleLabelSizeChange = async (size: string) => {
    setLabelSize(size);
    setSaving(true);

    try {
      const res = await fetch('/api/operator/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labelSize: size }),
      });

      if (res.ok) {
        toast.success(`Formato etichetta: ${size}`);
      } else {
        setLabelSize(size === '50x30' ? '50x40' : '50x30');
        const data = await res.json();
        setError(data.error || 'Errore');
      }
    } catch (err) {
      setLabelSize(size === '50x30' ? '50x40' : '50x30');
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
        <div className="mb-6 p-4 bg-error-50 border border-error-200 text-error-700 rounded-lg text-sm">
          {error}
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
          <Settings className="w-5 h-5" aria-hidden="true" />
          Approvazione automatica richieste
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Configura se le richieste vengono approvate automaticamente senza intervento dell&apos;operatore.
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <Switch
              checked={autoApproveRequests}
              onChange={(v) => handleAutoApproveToggle('autoApproveRequests', v)}
              label="Disponibilità"
              description="Richieste di disponibilità pubblicati da donatori"
              loading={saving}
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <Switch
              checked={autoApproveGoodsRequests}
              onChange={(v) => handleAutoApproveToggle('autoApproveGoodsRequests', v)}
              label="Richieste di beni"
              description="Richieste di beni da parte dei beneficiari"
              loading={saving}
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <Switch
              checked={autoApproveServicesRequests}
              onChange={(v) => handleAutoApproveToggle('autoApproveServicesRequests', v)}
              label="Richieste di servizi"
              description="Richieste di servizi da parte dei beneficiari"
              loading={saving}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Printer className="w-5 h-5" aria-hidden="true" />
          Stampa etichetta
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Abilita la stampa dell&apos;etichetta con QR code da applicare sugli oggetti consegnati al centro.
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <Switch
              checked={printLabel}
              onChange={handlePrintLabelToggle}
              label="Stampa etichetta"
              description="Proponi la stampa durante le operazioni di consegna e ritiro"
              loading={saving}
            />
          </div>

          {printLabel && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-900 mb-3">Formato etichetta</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleLabelSizeChange('50x30')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                    labelSize === '50x30'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileText className="w-6 h-6 mb-1 text-gray-700" aria-hidden="true" />
                  <div className="font-medium text-gray-900">50×30 mm</div>
                  <div className="text-xs text-gray-500">Formato standard</div>
                </button>
                <button
                  onClick={() => handleLabelSizeChange('50x40')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                    labelSize === '50x40'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ClipboardList className="w-6 h-6 mb-1 text-gray-700" aria-hidden="true" />
                  <div className="font-medium text-gray-900">50×40 mm</div>
                  <div className="text-xs text-gray-500">Formato grande</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Clock className="w-5 h-5" aria-hidden="true" />
          Orari e informazioni
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

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Tag className="w-5 h-5" aria-hidden="true" />
          Etichette scaffale
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Crea etichette per contrassegnare gli spazi di deposito nella tua struttura.
        </p>
        <button
          onClick={() => router.push('/operator/shelf-label')}
          className="px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 font-medium inline-flex items-center gap-2"
        >
          <Tag className="w-4 h-4" aria-hidden="true" />
          Crea etichetta scaffale
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5" aria-hidden="true" />
          Stampa locandina
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Stampa una locandina con QR code da esporre per promuovere la donazione.
        </p>
        <button
          onClick={() => window.open('/aderisci/print', '_blank')}
          className="px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 font-medium inline-flex items-center gap-2"
        >
          <Printer className="w-4 h-4" aria-hidden="true" />
          Stampa locandina
        </button>
      </div>
    </div>
  );
}
