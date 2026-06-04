'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3, AlertCircle, AlertTriangle, Info, Check,
} from 'lucide-react';
import { Button } from '@/components/ui';

export interface NeedScoreGaugeProps {
  /** Score 0-100. Valori fuori range vengono clampati a [0, 100]. */
  score: number;
  /** Se true, mostra il bottone "modifica" + range slider editabile. */
  editable?: boolean;
  /**
   * Callback invocata al "Salva" con il nuovo score. Se rigetta (throw),
   * il gauge mantiene lo stato di editing. Il parent è responsabile del
   * toast.success/error e dell'aggiornamento del proprio `score` state.
   */
  onSave?: (newScore: number) => void | Promise<void>;
  className?: string;
}

interface PriorityLevel {
  /** Soglia minima (inclusiva) per appartenere al livello. */
  threshold: number;
  /** Token semantico per stroke SVG. */
  stroke: string;
  /** Token semantico per testo centrale. */
  text: string;
  /** Label italiana. */
  label: string;
  /** Icona lucide (header + label). */
  Icon: React.ComponentType<{ className?: string }>;
}

const PRIORITY_LEVELS: PriorityLevel[] = [
  { threshold: 80, stroke: 'stroke-error-600', text: 'text-error-600', label: 'Alta priorità', Icon: AlertCircle },
  { threshold: 50, stroke: 'stroke-warning-600', text: 'text-warning-600', label: 'Media priorità', Icon: AlertTriangle },
  { threshold: 20, stroke: 'stroke-info-600', text: 'text-info-600', label: 'Bassa priorità', Icon: Info },
  { threshold: 0, stroke: 'stroke-gray-500', text: 'text-gray-500', label: 'Priorità minima', Icon: Check },
];

function getPriorityLevel(score: number): PriorityLevel {
  for (const level of PRIORITY_LEVELS) {
    if (score >= level.threshold) return level;
  }
  // Fallback inatteso (score negativo clampato a 0).
  return PRIORITY_LEVELS[PRIORITY_LEVELS.length - 1];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * <NeedScoreGauge> — gauge SVG circolare per visualizzare lo score
 * di bisogno (0-100) di un beneficiario.
 *
 * Read-only: SVG circolare con numero centrale + label priorità colorata.
 * Editable: aggiunge bottone "modifica" → range slider con Salva/Annulla.
 *
 * Self-contained: gestisce il proprio edit state internamente. Il parent
 * fornisce solo `score` (source of truth) e opzionalmente `onSave` callback.
 *
 * Coerente con la mappa status→colore in docs/DESIGN.md §2.3
 * (error=alta, warning=media, info=bassa, gray=minima).
 */
export function NeedScoreGauge({ score, editable, onSave, className }: NeedScoreGaugeProps) {
  const clampedScore = clamp(score, 0, 100);
  const [isEditing, setIsEditing] = useState(false);
  const [draftScore, setDraftScore] = useState(clampedScore);
  const [saving, setSaving] = useState(false);

  // Re-sync draftScore dal prop solo quando NON in editing,
  // per evitare reset indesiderato durante il salvataggio async.
  useEffect(() => {
    if (!isEditing) setDraftScore(clampedScore);
  }, [clampedScore, isEditing]);

  const level = getPriorityLevel(clampedScore);
  const dashLength = (clampedScore / 100) * 264;

  const handleEdit = () => {
    setDraftScore(clampedScore);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDraftScore(clampedScore);
  };

  const handleSave = async () => {
    if (!onSave) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(draftScore);
      setIsEditing(false);
    } catch {
      // Parent gestisce toast.error; gauge mantiene lo stato di editing
      // per consentire un nuovo tentativo.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-gray-600" />
          Score di Bisogno
        </h2>
        {editable && !isEditing && (
          <button
            type="button"
            onClick={handleEdit}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            modifica
          </button>
        )}
      </div>

      {isEditing ? (
        // Edit mode: range slider + Salva/Annulla
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={draftScore}
              onChange={(e) => setDraftScore(Number(e.target.value))}
              aria-label="Score di bisogno"
              className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <span className="font-bold text-xl w-14 text-center">{draftScore}</span>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={saving}
              onClick={handleSave}
            >
              {saving ? 'Salvataggio...' : 'Salva'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCancel}
              disabled={saving}
            >
              Annulla
            </Button>
          </div>
        </div>
      ) : (
        // Read-only: gauge SVG + label
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="12"
              />
              {/* Colored arc */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                className={level.stroke}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${dashLength} 264`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${level.text}`}>
                {clampedScore}
              </span>
              <span className="text-xs text-gray-400">/100</span>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-gray-600 mb-2 flex items-center gap-1.5">
              <level.Icon className={`h-4 w-4 ${level.text}`} />
              <span className={`${level.text} font-medium`}>{level.label}</span>
            </p>
            <p className="text-sm text-gray-400">
              0 = poco bisogno, 100 = molto bisogno
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
