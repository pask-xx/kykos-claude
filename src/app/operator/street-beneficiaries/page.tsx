'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CitySelector from '@/components/geo/CitySelector';
import { Button, Input, Textarea, Card, CardHeader, CardTitle, CardContent, Badge, Alert, Modal, ModalFooter, Spinner } from '@/components/ui';

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
    nickname: '', firstName: '', lastName: '', fiscalCode: (b.fiscalCode || '').toUpperCase(), birthDate: '',
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

  const router = useRouter();

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
          nickname: '', firstName: '', lastName: '', fiscalCode: (b.fiscalCode || '').toUpperCase(), birthDate: '',
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
    } catch {
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
      fiscalCode: (b.fiscalCode || '').toUpperCase(),
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
      const opsRes = await fetch('/api/operator/street-operators');
      if (opsRes.ok) {
        const data = await opsRes.json();
        setStreetOperators(data.streetOperators || []);
      }

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
    } catch {
      setError('Errore di connessione');
    } finally {
      setSavingOperators(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Beneficiari street</h1>
          <p className="text-sm text-gray-500 mt-1">Beneficiari senza account gestiti da te</p>
        </div>
        <Button
          variant={showForm ? 'secondary' : 'primary'}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Annulla' : '+ Nuovo beneficiario'}
        </Button>
      </div>

      {error && (
        <Alert type="error" title="Errore">
          {error}
        </Alert>
      )}

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Modifica beneficiario' : 'Nuovo beneficiario'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Nome *"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Cognome *"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, '') })}
                      placeholder="segreto.vento.42"
                      maxLength={30}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
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
                      size="sm"
                    >
                      {generatingNickname ? '...' : 'Genera'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Usato dagli enti per identificare il beneficiario</p>
                </div>
                <Input
                  label="Codice Fiscale"
                  value={formData.fiscalCode}
                  onChange={(e) => setFormData({ ...formData, fiscalCode: e.target.value.toUpperCase() })}
                  placeholder="RSSMRA85T10A562U"
                  maxLength={16}
                />
                <Input
                  label="Data di nascita"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Indirizzo"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Via Roma, 123"
                  />
                </div>
                <Input
                  label="Numero civico"
                  value={formData.houseNumber}
                  onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                />
                <Input
                  label="CAP"
                  value={formData.cap}
                  onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                  maxLength={5}
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Città e Provincia</label>
                  <CitySelector
                    selectedProvince={formData.province}
                    selectedCity={formData.city}
                    onProvinceChange={(sigla) => setFormData(prev => ({ ...prev, province: sigla }))}
                    onCityChange={(name) => setFormData(prev => ({ ...prev, city: name }))}
                  />
                </div>
                <Input
                  label="ISEE (€)"
                  type="number"
                  step="0.01"
                  value={formData.isee}
                  onChange={(e) => setFormData({ ...formData, isee: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              {/* Geolocation */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="font-medium text-gray-900 flex items-center gap-2 text-sm mb-2">
                  📍 Geolocalizzazione
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  {formData.latitude && formData.longitude
                    ? `Posizione: ${parseFloat(formData.latitude).toFixed(4)}, ${parseFloat(formData.longitude).toFixed(4)}`
                    : 'Non rilevata'}
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={geocodeFromAddress}
                  disabled={geocoding || !formData.address || !formData.city}
                >
                  {geocoding ? '⏳ Calcolo...' : '🏠 Calcola da indirizzo'}
                </Button>
                {locationError && (
                  <p className="text-xs text-red-600 mt-2">{locationError}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ nickname: '', firstName: '', lastName: '', fiscalCode: (b.fiscalCode || '').toUpperCase(), birthDate: '', address: '', houseNumber: '', cap: '', city: '', province: '', isee: '', latitude: '', longitude: '' });
                  }}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={creating}
                >
                  {editingId ? 'Salva modifiche' : 'Crea beneficiario'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      {beneficiaries.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-5xl mb-4">🧑‍🤝‍🧑</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessun beneficiario</h3>
          <p className="text-gray-500 text-sm">Nessun beneficiario gestito da te al momento.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {beneficiaries.map((b) => (
            <Link key={b.id} href={`/operator/street-beneficiaries/${b.id}`}>
              <Card padding="none" className="hover:border-primary-300 transition-colors cursor-pointer">
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xl">👤</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{b.firstName} {b.lastName}</h3>
                      <p className="text-sm text-gray-500">{[b.address, b.city].filter(Boolean).join(', ')}</p>
                      {b.nickname && (
                        <Badge variant="primary" size="sm" className="mt-1 font-mono">@{b.nickname}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" onClick={(e) => { e.preventDefault(); startEdit(b); }}>Modifica</Button>
                      <span className="text-gray-400">→</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Assegna Operatori Modal */}
      <Modal
        isOpen={showOperatorsModal}
        onClose={() => setShowOperatorsModal(false)}
        title="Assegna operatori"
        size="md"
      >
        {selectedBeneficiary && (
          <>
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">
                Beneficiario: <strong>{selectedBeneficiary.firstName} {selectedBeneficiary.lastName}</strong>
              </p>

              {loadingOperators ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
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

            <ModalFooter>
              <div className="flex gap-3 w-full">
                <Button
                  variant="secondary"
                  onClick={() => setShowOperatorsModal(false)}
                  className="flex-1"
                >
                  Annulla
                </Button>
                <Button
                  variant="primary"
                  onClick={saveOperatorsAssignment}
                  loading={savingOperators}
                  className="flex-1"
                >
                  Salva
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  );
}
