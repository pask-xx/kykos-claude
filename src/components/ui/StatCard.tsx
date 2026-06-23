'use client';

import { forwardRef, ReactNode } from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { cn } from '@/lib/utils';

/**
 * Token semantico per icona+sfondo della stat card.
 *
 * - `danger` mappa internamente al token `error` della palette KYKOS
 *   (la palette usa `error-*`, vedi docs/DESIGN.md §2.3). Esporre
 *   `danger` come API è più parlante in italiano per i consumer.
 * - `default` = grigio neutro (nessun tono semantico).
 */
export type StatCardTone = 'warning' | 'success' | 'primary' | 'secondary' | 'danger' | 'info' | 'default';

const toneClasses: Record<StatCardTone, { wrapper: string; icon: string }> = {
  warning:   { wrapper: 'bg-warning-100',   icon: 'text-warning-600' },
  success:   { wrapper: 'bg-success-100',   icon: 'text-success-600' },
  primary:   { wrapper: 'bg-primary-100',   icon: 'text-primary-600' },
  secondary: { wrapper: 'bg-secondary-100', icon: 'text-secondary-600' },
  danger:    { wrapper: 'bg-error-100',     icon: 'text-error-600' },
  info:      { wrapper: 'bg-info-100',      icon: 'text-info-600' },
  default:   { wrapper: 'bg-gray-100',      icon: 'text-gray-600' },
};

export interface StatCardProps {
  /**
   * Icona lucide-react. Renderizzata in un wrapper 48x48 con sfondo
   * del `tone` scelto. L'icona è SEMPRE `aria-hidden="true"` (regola
   * Fase 21: icona decorativa in card stat).
   */
  icon: LucideIcon;
  /** Label breve sopra al valore (1-3 parole), es. "Richieste in attesa". */
  label: string;
  /** Valore numerico o stringa (es. 12, "0", "3/10"). Renderizzato in `text-2xl font-bold`. */
  value: ReactNode;
  /**
   * Token semantico del colore icona+sfondo. Default: `'primary'`.
   * `danger` mappa internamente a `bg-error-100` (palette KYKOS).
   */
  tone?: StatCardTone;
  /**
   * Se passato, la card è cliccabile (wrapper `<Link>` con focus ring
   * primary-500). Se omesso, la card è statica (wrapper `<div>`).
   * Path tipico: pagina lista filtrata (es. `/operator/requests-entity?status=PENDING`).
   */
  href?: string;
  /** Sub-label sotto al valore (es. "3 scadono oggi"). Opzionale. */
  sublabel?: string;
  /** Classi extra sul wrapper. */
  className?: string;
  /**
   * aria-label esplicito per screen reader. Default: `${label}: ${value}`.
   * Passare SEMPRE esplicitamente se `value` è JSX complesso o contiene
   * PII (raro, di norma la dashboard mostra solo conteggi).
   */
  ariaLabel?: string;
}

/**
 * <StatCard> — contatore visuale riusabile per dashboard.
 *
 * Estratta dal pattern ripetuto in operator/dashboard, admin/dashboard
 * e intermediary/dashboard (commit 2026-06-23) per centralizzare:
 * - il wrapper `bg-white p-6 rounded-xl shadow-sm border` (riusa <Card>)
 * - il layout `flex items-center gap-4` icona+testo
 * - la palette semantica per wrapper icona (warning/success/...)
 * - il link cliccabile con focus ring + hover state
 *
 * **Comportamento wrapper**:
 * - Con `href`: wrapper `<Link>` (Next.js) con `hover:border-primary-300
 *   transition-colors` + `focus-visible:ring-2 focus-visible:ring-primary-500`.
 *   aria-label dinamico: `${label}: ${value}`.
 * - Senza `href`: wrapper `<div>` statico (display only).
 *
 * **Tone mapping** (palette semantica KYKOS):
 * - `warning` → `bg-warning-100` + `text-warning-600`
 * - `success` → `bg-success-100` + `text-success-600`
 * - `primary` → `bg-primary-100` + `text-primary-600` (default)
 * - `secondary` → `bg-secondary-100` + `text-secondary-600`
 * - `danger` → `bg-error-100` + `text-error-600` (alias di `error`)
 * - `info` → `bg-info-100` + `text-info-600`
 * - `default` → `bg-gray-100` + `text-gray-600`
 *
 * **Accessibilità** (regole 01-core-principles + 05-known-issues):
 * - Icona SEMPRE `aria-hidden="true"` (Fase 21).
 * - Link con `aria-label` calcolato (default) o esplicito (custom).
 * - Focus ring primary-500 con offset 2 (stessa convenzione di EntityListCard).
 * - MAI `<div onClick>` (Fase 14): con `href` usa `<Link>` semantico.
 *
 * **Esempio d'uso**:
 *   <StatCard
 *     icon={Clock}
 *     label="Richieste in attesa"
 *     value={12}
 *     tone="warning"
 *     href="/operator/requests-entity?status=PENDING"
 *   />
 */
export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  function StatCard(
    {
      icon: Icon,
      label,
      value,
      tone = 'primary',
      href,
      sublabel,
      className,
      ariaLabel,
    },
    ref,
  ) {
    const toneStyle = toneClasses[tone];
    const computedAriaLabel = ariaLabel ?? `${label}: ${value}`;

    // Contenuto interno riusato in tutte le varianti wrapper
    const inner = (
      <div className="flex items-center gap-4">
        {/* Wrapper icona: dimensione fissa 48x48, tonalità semantica */}
        <div
          className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
            toneStyle.wrapper,
          )}
        >
          <Icon className={cn('w-6 h-6', toneStyle.icon)} aria-hidden="true" />
        </div>

        {/* Colonna testo: label sopra, valore sotto, sublabel opzionale */}
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
        </div>
      </div>
    );

    // Variante 1: cliccabile (href presente) → wrapper <Link>
    if (href) {
      return (
        <Card
          ref={ref}
          variant="bordered"
          padding="md"
          className={cn(
            'block transition-colors hover:border-primary-300',
            'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
            'rounded-xl',
            className,
          )}
        >
          <Link
            href={href}
            aria-label={computedAriaLabel}
            className="block rounded-lg focus-visible:outline-none"
          >
            {inner}
          </Link>
        </Card>
      );
    }

    // Variante 2: statica (display only)
    return (
      <Card
        ref={ref}
        variant="bordered"
        padding="md"
        className={className}
      >
        {inner}
      </Card>
    );
  },
);
