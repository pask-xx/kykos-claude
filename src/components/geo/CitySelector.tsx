'use client';

import { useState, useEffect } from 'react';

interface Province {
  id: string;
  sigla: string;
  name: string;
}

interface Comune {
  id: string;
  istat: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface CitySelectorProps {
  selectedProvince: string;
  selectedCity: string;
  onProvinceChange: (sigla: string) => void;
  onCityChange: (name: string, latitude?: number | null, longitude?: number | null) => void;
  required?: boolean;
}

export default function CitySelector({
  selectedProvince,
  selectedCity,
  onProvinceChange,
  onCityChange,
  required = false,
}: CitySelectorProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [comuni, setComuni] = useState<Comune[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingComuni, setLoadingComuni] = useState(false);

  // Fetch provinces on mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  // Fetch comuni when province changes
  useEffect(() => {
    if (selectedProvince) {
      fetchComuni(selectedProvince);
    } else {
      setComuni([]);
    }
  }, [selectedProvince]);

  const fetchProvinces = async () => {
    try {
      const res = await fetch('/api/geo/provinces');
      const data = await res.json();
      setProvinces(data.provinces || []);
    } catch (error) {
      console.error('Error fetching provinces:', error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const fetchComuni = async (sigla: string) => {
    setLoadingComuni(true);
    try {
      const res = await fetch(`/api/geo/comunes?province=${encodeURIComponent(sigla)}`);
      const data = await res.json();
      setComuni(data.comuni || []);
    } catch (error) {
      console.error('Error fetching comuni:', error);
    } finally {
      setLoadingComuni(false);
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sigla = e.target.value;
    onProvinceChange(sigla);
    onCityChange('', null, null); // Reset city selection
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const comuneName = e.target.value;
    const comune = comuni.find((c) => c.name === comuneName);
    onCityChange(comuneName, comune?.latitude ?? null, comune?.longitude ?? null);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Provincia {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedProvince}
          onChange={handleProvinceChange}
          required={required}
          disabled={loadingProvinces}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition disabled:bg-gray-100"
        >
          <option value="">
            {loadingProvinces ? 'Caricamento...' : 'Seleziona provincia'}
          </option>
          {provinces.map((prov) => (
            <option key={prov.id} value={prov.sigla}>
              {prov.name} ({prov.sigla})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Comune {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedCity}
          onChange={handleCityChange}
          required={required}
          disabled={!selectedProvince || loadingComuni}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition disabled:bg-gray-100"
        >
          <option value="">
            {!selectedProvince
              ? 'Seleziona prima la provincia'
              : loadingComuni
              ? 'Caricamento...'
              : 'Seleziona comune'}
          </option>
          {comuni.map((comune) => (
            <option key={comune.id} value={comune.name}>
              {comune.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
