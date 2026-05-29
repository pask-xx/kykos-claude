'use client';

import { useState, useEffect, useCallback } from 'react';
import CitySelector from '@/components/geo/CitySelector';

interface StreetBeneficiary {
  id: string;
  nickname: string | null;
  firstName: string;
  lastName: string;
  fiscalCode: string | null;
  birthDate: string | null;
  address: string | null;
  houseNumber: string | null;
  cap: string | null;
  city: string | null;
  province: string | null;
  isee: string | null;
  latitude: number | null;
  longitude: number | null;
  isStreetManaged: boolean;
  createdAt: string;
  assignedAt: string;
  referenceEntity?: {
    id: string;
    name: string;
    city: string | null;
  };
}

interface StreetOperator {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

interface FormData {
  nickname: string;
  firstName: string;
  lastName: string;
  fiscalCode: string;
  birthDate: string;
  address: string;
  houseNumber: string;
  cap: string;
  city: string;
  province: string;
  isee: string;
  latitude: string;
  longitude: string;
}

export default function StreetBeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState<StreetBeneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nickname: '', firstName: '', lastName: '', fiscalCode: '', birthDate: '',
    address: '', houseNumber: '', cap: '', city: '', province: '', isee: '',
    latitude: '', longitude: '',
  });
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [generatingNickname, setGeneratingNickname] = useState(false);
  const [showOperatorsModal, setShowOperatorsModal] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<StreetBeneficiary | null>(null);
  const [streetOperators, setStreetOperators] = useState<StreetOperator[]>([]);
  const [assignedOperatorIds, setAssignedOperatorIds] = useState<string[]>([]);
  const [loadingOperators, setLoadingOperators] = useState(false);
  const [savingOperators, setSavingOperators] = useState(false);

  const fetchBeneficiaries = useCallback(async () => {
    try {
      const res = await fetch('/api/operator/street-beneficiaries');
      if (!res.ok) throw new Error('Errore nel caricamento');
      const data = await res.json();
      setBeneficiaries(data.beneficiaries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore generico');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBeneficiaries();
  }, [fetchBeneficiaries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) return;

    setCreating(true);
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const body = editingId ? { ...formData, id: editingId } : formData;
      const res = await fetch('/api/operator/street-beneficiaries', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setFormData({
          nickname: '', firstName: '', lastName: '', fiscalCode: '', birthDate: '',
          address: '', houseNumber: '', cap: '', city: '', province: '', isee: '',
          latitude: '', longitude: '',
        });
        setShowForm(false);
        setEditingId(null);
        fetchBeneficiaries();
      } else {
        const data = await res.json();
        setError(data.error || (editingId ? 'Errore durante il salvataggio' : 'Errore nella creazione'));
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (b: StreetBeneficiary) => {
    setEditingId(b.id);
    setFormData({
      nickname: b.nickname || '',
      firstName: b.firstName,
      lastName: b.lastName,
      fiscalCode: b.fiscalCode || '',
      birthDate: b.birthDate ? new Date(b.birthDate).toISOString().split('T')[0] : '',
      address: b.address || '',
      houseNumber: b.houseNumber || '',
      cap: b.cap || '',
      city: b.city || '',
      province: b.province || '',
      isee: b.isee || '',
      latitude: b.latitude?.toString() || '',
      longitude: b.longitude?.toString() || '',
    });
    setShowForm(true);
    setExpandedId(null);
  };

  const geocodeFromAddress = async () => {
    if (!formData.address || !formData.city) {
      setLocationError('Inserisci prima indirizzo e città');
      return;
    }
    setGeocoding(true);
    setLocationError('');
    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: formData.address,
          city: formData.city,
          cap: formData.cap,
          province: formData.province,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLocationError(data.error || 'Errore nel calcolo della posizione');
        return;
      }
      setFormData(prev => ({
        ...prev,
        latitude: data.latitude.toString(),
        longitude: data.longitude.toString(),
      }));
    } catch {
      setLocationError('Errore di connessione');
    } finally {
      setGeocoding(false);
    }
  };

  const openOperatorsModal = async (b: StreetBeneficiary) => {
    setSelectedBeneficiary(b);
    setShowOperatorsModal(true);
    setLoadingOperators(true);
    setAssignedOperatorIds([]);

    try {
      // Fetch all street operators
      const opsRes = await fetch('/api/operator/street-operators');
      if (opsRes.ok) {
        const data = await opsRes.json();
        setStreetOperators(data.streetOperators || []);
      }

      // Fetch currently assigned operators
      const assignedRes = await fetch(`/api/operator/street-beneficiaries/${b.id}/operators`);
      if (assignedRes.ok) {
        const data = await assignedRes.json();
        setAssignedOperatorIds(data.operators?.map((op: StreetOperator) => op.id) || []);
      }
    } catch (err) {
      console.error('Error loading operators:', err);
    } finally {
      setLoadingOperators(false);
    }
  };

  const saveOperatorsAssignment = async () => {
    if (!selectedBeneficiary) return;
    setSavingOperators(true);

    try {
      const res = await fetch(`/api/operator/street-beneficiaries/${selectedBeneficiary.id}/operators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorIds: assignedOperatorIds }),
      });

      if (res.ok) {
        setShowOperatorsModal(false);
        setSelectedBeneficiary(null);
        fetchBeneficiaries();
      } else {
        const data = await res.json();
        setError(data.error || 'Errore nel salvataggio');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setSavingOperators(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>{error}</p>
        <button onClick={() => { setError(null); setLoading(true); fetchBeneficiaries(); }} className="mt-2 text-sm text-primary-600 hover:underline">
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Beneficiari street</h1>
          <p className="text-sm text-gray-500 mt-1">Beneficiari senza account gestiti da te</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          {showForm ? 'Annulla' : '+ Nuovo beneficiario'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Modifica beneficiario' : 'Nuovo beneficiario'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cognome *</label>
                <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                <div className="flex gap-2">
                  <input type="text" value={formData.nickname} onChange={(e) => setFormData({ ...formData, nickname: e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, '') })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="segreto.vento.42" maxLength={30} />
                  <button
                    type="button"
                    onClick={async () => {
                      setGeneratingNickname(true);
                      try {
                        const adjectives = ['buono', 'gentile', 'caldo', 'luminoso', 'mite', 'sereno', 'solare', 'felice', 'saggio', 'ardito', 'coraggioso', 'giusto', 'puro', 'lucente', 'pacifico', 'grazioso', 'speranzoso', 'allegro', 'fiducioso', 'rapido', 'selvaggio', 'delicato', 'amorevole', 'premuroso', 'generoso', 'nobile'];
                        const nouns = ['cuore', 'anima', 'spirito', 'sogno', 'speranza', 'sole', 'stella', 'luna', 'nuvola', 'pioggia', 'vento', 'fiore', 'albero', 'uccello', 'foglia', 'fiume', 'montagna', 'oceano', 'foresta', 'giardino', 'melodia', 'armonia', 'sapienza', 'coraggio', 'pace', 'gioia'];
                        const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
                        setFormData(prev => ({ ...prev, nickname: `${pick(adjectives)}.${pick(nouns)}.${Math.floor(Math.random() * 999) + 1}` }));
                      } finally {
                        setGeneratingNickname(false);
                      }
                    }}
                    disabled={generatingNickname}
                    className="px-4 py-2 bg-secondary-100 text-secondary-700 text-sm font-medium rounded-lg hover:bg-secondary-200 disabled:opacity-50 transition"
                  >
                    {generatingNickname ? '...' : 'Genera'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Usato dagli enti per identificare il beneficiario</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codice Fiscale</label>
                <input type="text" value={formData.fiscalCode} onChange={(e) => setFormData({ ...formData, fiscalCode: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none uppercase" maxLength={16} placeholder="RSSMRA85T10A562U" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data di nascita</label>
                <input type="date" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="Via Roma, 123" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numero civico</label>
                <input type="text" value={formData.houseNumber} onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
                <input type="text" value={formData.cap} onChange={(e) => setFormData({ ...formData, cap: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" maxLength={5} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Città e Provincia</label>
                <CitySelector
                  selectedProvince={formData.province}
                  selectedCity={formData.city}
                  onProvinceChange={(sigla) => setFormData(prev => ({ ...prev, province: sigla }))}
                  onCityChange={(name) => setFormData(prev => ({ ...prev, city: name }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ISEE (€)</label>
                <input type="number" step="0.01" value={formData.isee} onChange={(e) => setFormData({ ...formData, isee: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="0.00" />
              </div>
            </div>

            {/* Geolocation */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="font-medium text-gray-900 flex items-center gap-2 text-sm mb-2">
                <span>📍</span> Geolocalizzazione
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                {formData.latitude && formData.longitude
                  ? `Posizione: ${parseFloat(formData.latitude).toFixed(4)}, ${parseFloat(formData.longitude).toFixed(4)}`
                  : 'Non rilevata'}
              </p>
              <button
                type="button"
                onClick={geocodeFromAddress}
                disabled={geocoding || !formData.address || !formData.city}
                className="px-3 py-2 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition flex items-center gap-1"
              >
                {geocoding ? '⏳ Calcolo...' : '🏠 Calcola da indirizzo'}
              </button>
              {locationError && (
                <p className="text-xs text-red-600 mt-2">{locationError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setFormData({ nickname: '', firstName: '', lastName: '', fiscalCode: '', birthDate: '', address: '', houseNumber: '', cap: '', city: '', province: '', isee: '', latitude: '', longitude: '' }); }} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">Annulla</button>
              <button type="submit" disabled={creating} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">{creating ? (editingId ? 'Salvataggio...' : 'Creazione...') : (editingId ? 'Salva modifiche' : 'Crea beneficiario')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Assegna Operatori Modal */}
      {showOperatorsModal && selectedBeneficiary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Assegna operatori</h3>
                <button
                  onClick={() => setShowOperatorsModal(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Beneficiario: <strong>{selectedBeneficiary.firstName} {selectedBeneficiary.lastName}</strong>
              </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingOperators ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : streetOperators.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nessun operatore di strada disponibile</p>
              ) : (
                <div className="space-y-2">
                  {streetOperators.map(op => (
                    <label
                      key={op.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                        assignedOperatorIds.includes(op.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={assignedOperatorIds.includes(op.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignedOperatorIds(prev => [...prev, op.id]);
                          } else {
                            setAssignedOperatorIds(prev => prev.filter(id => id !== op.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{op.firstName} {op.lastName}</p>
                        <p className="text-sm text-gray-500">{op.email || op.phone || '-'}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowOperatorsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Annulla
                </button>
                <button
                  onClick={saveOperatorsAssignment}
                  disabled={savingOperators}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
                >
                  {savingOperators ? 'Salvataggio...' : 'Salva'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {beneficiaries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
          <div className="text-5xl mb-4">🧑‍🤝‍🧑</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun beneficiario</h3>
          <p className="text-gray-500 text-sm">Nessun beneficiario gestito da te al momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {beneficiaries.map((b) => (
            <div key={b.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 cursor-pointer" onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{b.firstName} {b.lastName}</h3>
                    <p className="text-sm text-gray-500">{[b.address, b.city].filter(Boolean).join(', ')}</p>
                    {b.nickname && (
                      <p className="text-xs text-secondary-600 font-mono mt-0.5">@{b.nickname}</p>
                    )}
                  </div>
                  <span className={`text-gray-400 transition-transform ${expandedId === b.id ? 'rotate-180' : ''}`}>▼</span>
                </div>
              </div>

              {expandedId === b.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {b.nickname && <div><span className="text-gray-500">Nickname:</span><p className="font-medium font-mono">@{b.nickname}</p></div>}
                    <div><span className="text-gray-500">Codice Fiscale:</span><p className="font-medium">{b.fiscalCode || '-'}</p></div>
                    <div><span className="text-gray-500">Data nascita:</span><p className="font-medium">{b.birthDate ? new Date(b.birthDate).toLocaleDateString('it-IT') : '-'}</p></div>
                    <div><span className="text-gray-500">ISEE:</span><p className="font-medium">{b.isee ? `€${parseFloat(b.isee).toLocaleString('it-IT')}` : '-'}</p></div>
                    <div><span className="text-gray-500">Indirizzo:</span><p className="font-medium">{b.address || '-'}{b.houseNumber ? `, ${b.houseNumber}` : ''}</p></div>
                    <div><span className="text-gray-500">CAP:</span><p className="font-medium">{b.cap || '-'}</p></div>
                    <div><span className="text-gray-500">Città:</span><p className="font-medium">{b.city || '-'} {b.province ? `(${b.province})` : ''}</p></div>
                    {b.latitude && b.longitude && <div><span className="text-gray-500">Coords:</span><p className="font-medium">{b.latitude.toFixed(4)}, {b.longitude.toFixed(4)}</p></div>}
                    <div><span className="text-gray-500">Creato il:</span><p className="font-medium">{new Date(b.createdAt).toLocaleDateString('it-IT')}</p></div>
                    <div><span className="text-gray-500">Assegnato il:</span><p className="font-medium">{new Date(b.assignedAt).toLocaleDateString('it-IT')}</p></div>
                    {b.referenceEntity && <div><span className="text-gray-500">Ente:</span><p className="font-medium">{b.referenceEntity.name}</p></div>}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => startEdit(b)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Modifica</button>
                    <button onClick={() => openOperatorsModal(b)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Assegna operatori</button>
                    <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Crea richiesta</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}