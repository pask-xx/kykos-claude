'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Organization {
  id: string;
  name: string;
  city: string;
  province: string;
  address: string;
  distance: number;
}

interface VolunteerAssociation {
  id: string;
  status: string;
  skills: string[];
  startDate: string | null;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    city: string;
    province: string;
    address: string;
  };
  distance: number | null;
}

const SKILLS = [
  { value: 'Distribuzione', label: 'Distribuzione' },
  { value: 'Assistenza', label: 'Assistenza' },
  { value: 'Amministrativo', label: 'Amministrativo' },
  { value: 'Animazione', label: 'Animazione' },
  { value: 'Trasporto', label: 'Trasporto' },
  { value: 'Altro', label: 'Altro' },
];

export default function VolunteerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [associations, setAssociations] = useState<VolunteerAssociation[]>([]);
  const [withdrawLoading, setWithdrawLoading] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [availableOrgs, setAvailableOrgs] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [note, setNote] = useState<string>('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUrl, setCvUrl] = useState<string>('');
  const [uploadingCv, setUploadingCv] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState<VolunteerAssociation | null>(null);

  useEffect(() => {
    fetchUserAndAssociations();
  }, []);

  const fetchUserAndAssociations = async () => {
    try {
      // Get user session to know their role and redirect
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();

      if (!meData.user) {
        router.push('/auth/login');
        return;
      }

      setUserRole(meData.user.role);

      // Get associations data
      const assocRes = await fetch('/api/volunteer/associations');
      const assocData = await assocRes.json();
      const associationsList = assocData.associations || [];

      // Redirect to apply page if not approved volunteer
      if (meData.user.role === 'DONOR' || meData.user.role === 'RECIPIENT') {
        const approvedCount = associationsList.filter(
          (a: VolunteerAssociation) => a.status === 'APPROVED'
        ).length;

        if (approvedCount === 0) {
          router.push('/volunteer/apply');
          return;
        }
      }

      setAssociations(associationsList);
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssociations = async () => {
    try {
      const res = await fetch('/api/volunteer/associations');
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore nel caricamento');
        setLoading(false);
        return;
      }

      setAssociations(data.associations || []);
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (associationId: string) => {
    setWithdrawLoading(associationId);
    setError(null);

    try {
      const res = await fetch(`/api/volunteer/associations?id=${associationId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        setAssociations(prev => prev.filter(a => a.id !== associationId));
        setSuccess('Disponibilità ritirata con successo. L\'ente è stato notificato.');
        setConfirmWithdraw(null);
      } else {
        setError(data.error || 'Errore durante il ritiro');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setWithdrawLoading(null);
    }
  };

  const openApplyModal = async () => {
    // Get already associated org IDs to exclude
    const approvedOrgIds = associations
      .filter(a => a.status === 'APPROVED')
      .map(a => a.organization.id);

    try {
      const res = await fetch(`/api/volunteer/available?exclude=${approvedOrgIds.join(',')}`);
      const data = await res.json();

      if (res.ok) {
        setAvailableOrgs(data.organizations || []);
        setShowApplyModal(true);
      } else {
        setError(data.error || 'Errore nel caricamento enti');
      }
    } catch (err) {
      setError('Errore di connessione');
    }
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo di file non supportato. Usa PDF, DOC, DOCX o immagini.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File troppo grande (max 10MB)');
      return;
    }

    setCvFile(file);
    setError(null);

    setUploadingCv(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/volunteer/upload-cv', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setCvUrl(data.url);
      } else {
        setError(data.error || 'Errore upload CV');
        setCvFile(null);
      }
    } catch (err) {
      setError('Errore upload CV');
      setCvFile(null);
    } finally {
      setUploadingCv(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedOrg) {
      setError('Seleziona un ente');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/volunteer/associations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: selectedOrg,
          skills: selectedSkills,
          note: note.trim() || undefined,
          cvUrl: cvUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Candidatura inviata! Riceverai una notifica quando l\'ente la revisionerà.');
        setShowApplyModal(false);
        setSelectedOrg('');
        setSelectedSkills([]);
        setNote('');
        setCvFile(null);
        setCvUrl('');
        setPrivacyConsent(false);
        // Refresh associations
        setAssociations([]);
        fetchUserAndAssociations();
      } else {
        setError(data.error || 'Errore durante l\'invio');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDistance = (km: number | null) => {
    if (km === null) return '-';
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT');
  };

  const approvedAssociations = associations.filter(a => a.status === 'APPROVED');
  const pendingAssociations = associations.filter(a => a.status === 'PENDING');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={userRole === 'RECIPIENT' ? '/recipient/dashboard' : '/donor/dashboard'} className="text-sm text-gray-500 hover:text-gray-700">
          ← Torna alla dashboard
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">🤝</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Volontariato</h1>
          <p className="text-gray-600">Gestisci le tue attività di volontariato</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Approved Volunteer Associations */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span>🏢</span> Enti dove presto servizio
            {approvedAssociations.length > 0 && (
              <span className="ml-2 bg-green-100 text-green-700 text-sm px-2 py-0.5 rounded-full">
                {approvedAssociations.length}
              </span>
            )}
          </h2>
          <button
            onClick={openApplyModal}
            className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 font-medium"
          >
            + Candidati ad altro ente
          </button>
        </div>

        {approvedAssociations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun ente associato</h3>
            <p className="text-gray-500 mb-4">
              Non sei ancora volontario di nessun ente. Candidati per iniziare!
            </p>
            <button
              onClick={openApplyModal}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Candidati ad un ente
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Ente</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Skills</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Data inizio</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {approvedAssociations.map(assoc => (
                  <tr key={assoc.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">{assoc.organization.name}</p>
                      <p className="text-sm text-gray-500">
                        {assoc.organization.address && `${assoc.organization.address}, `}
                        {assoc.organization.city} ({assoc.organization.province})
                      </p>
                      {assoc.distance !== null && (
                        <p className="text-xs text-gray-400 mt-1">📍 {formatDistance(assoc.distance)} da te</p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {assoc.skills && assoc.skills.length > 0 ? (
                          assoc.skills.map(skill => (
                            <span key={skill} className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {formatDate(assoc.startDate)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setConfirmWithdraw(assoc)}
                        className="px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 font-medium"
                      >
                        Ritira disponibilità
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Applications */}
      {pendingAssociations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <span>⏳</span> Candidature in corso
            <span className="ml-2 bg-amber-100 text-amber-700 text-sm px-2 py-0.5 rounded-full">
              {pendingAssociations.length}
            </span>
          </h2>
          <div className="space-y-3">
            {pendingAssociations.map(assoc => (
              <div key={assoc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{assoc.organization.name}</p>
                  <p className="text-sm text-gray-500">
                    Candidatura del {formatDate(assoc.createdAt)}
                  </p>
                </div>
                <span className="text-sm text-amber-600 font-medium">In revisione</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Withdraw Confirmation Modal */}
      {confirmWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmWithdraw(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Conferma ritiro disponibilità</h3>
            <p className="text-gray-600 mb-4">
              Stai per ritirare la tua disponibilità da{' '}
              <strong>{confirmWithdraw.organization.name}</strong>.
              L'ente verrà notificato di questa decisione.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmWithdraw(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Annulla
              </button>
              <button
                onClick={() => handleWithdraw(confirmWithdraw.id)}
                disabled={withdrawLoading === confirmWithdraw.id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {withdrawLoading === confirmWithdraw.id ? 'Ritiro in corso...' : 'Conferma ritiro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply to New Organization Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowApplyModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Candidati ad altro ente</h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {availableOrgs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🏢</div>
                <p className="text-gray-500">
                  Non ci sono altri enti disponibili nel raggio di 30km.
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Completa il tuo profilo con un indirizzo valido per vedere più enti.
                </p>
                <Link
                  href="/donor/profile"
                  className="inline-block mt-4 text-primary-600 hover:underline"
                >
                  Vai al mio profilo →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleziona l'ente per cui vuoi candidarti
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {availableOrgs.map(org => (
                      <label
                        key={org.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                          selectedOrg === org.id
                            ? 'bg-primary-50 border border-primary-300'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <input
                          type="radio"
                          name="organization"
                          value={org.id}
                          checked={selectedOrg === org.id}
                          onChange={() => setSelectedOrg(org.id)}
                          className="text-primary-600"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{org.name}</p>
                          <p className="text-sm text-gray-500">
                            {org.address && `${org.address}, `}{org.city} ({org.province})
                          </p>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {formatDistance(org.distance)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Disponibilità (opzionale)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SKILLS.map(skill => (
                      <label
                        key={skill.value}
                        className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition ${
                          selectedSkills.includes(skill.value)
                            ? 'bg-primary-50 border-primary-300'
                            : 'hover:bg-gray-50 border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSkills.includes(skill.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSkills([...selectedSkills, skill.value]);
                            } else {
                              setSelectedSkills(selectedSkills.filter(s => s !== skill.value));
                            }
                          }}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{skill.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note per l'ente (opzionale)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Racconta qualcosa su di te..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Carica il tuo CV (opzionale)
                  </label>
                  {cvUrl ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-green-600">✅ CV caricato</span>
                      <button
                        type="button"
                        onClick={() => { setCvFile(null); setCvUrl(''); }}
                        className="ml-auto text-sm text-red-600 hover:underline"
                      >
                        Rimuovi
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition">
                      <input
                        type="file"
                        id="cv-upload-modal"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                        onChange={handleCvUpload}
                        disabled={uploadingCv}
                        className="hidden"
                      />
                      <label htmlFor="cv-upload-modal" className="cursor-pointer">
                        {uploadingCv ? (
                          <span className="text-gray-500">Caricamento...</span>
                        ) : (
                          <>
                            <span className="text-2xl block mb-1">📄</span>
                            <span className="text-sm text-gray-600">Clicca per selezionare un file</span>
                            <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacyConsent}
                      onChange={(e) => setPrivacyConsent(e.target.checked)}
                      className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-600">
                      Acconsento al trattamento dei miei dati personali secondo la normativa sulla Privacy.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedOrg || !privacyConsent}
                  className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Invio in corso...' : 'Invia candidatura'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}