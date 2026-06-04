'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Tabs primitive — tabs orizzontali con tre varianti:
 *  - "default": sfondo attivo primary-100 + bordo primary-300 (pattern replicato
 *    in 6+ pagine: donor/requests, recipient/requests, operator/requests-entity,
 *    operator/reports, intermediary/reports, donor/requests)
 *  - "pills": pill piene primary-600 su attivo
 *  - "underline": solo linea inferiore primary-600
 *
 * Stato controllato: il consumer possiede `value` e gestisce `onChange`.
 *
 * Esempio:
 *   const [tab, setTab] = useState<'all' | 'active' | 'completed'>('all');
 *   <Tabs
 *     value={tab}
 *     onChange={setTab}
 *     items={[
 *       { value: 'all', label: 'Tutte', count: 12 },
 *       { value: 'active', label: 'Attive', count: 5 },
 *       { value: 'completed', label: 'Completate', count: 7 },
 *     ]}
 *     variant="default"
 *   />
 */

export interface TabItem<T extends string = string> {
  value: T;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface TabsProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  items: TabItem<T>[];
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
  ariaLabel?: string;
}

export function Tabs<T extends string = string>({
  value,
  onChange,
  items,
  variant = 'default',
  className,
  ariaLabel,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'flex gap-2',
        variant === 'underline' && 'border-b border-gray-200',
        className
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            disabled={item.disabled}
            onClick={() => !item.disabled && onChange(item.value)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition rounded-lg disabled:opacity-50 disabled:cursor-not-allowed',
              variant === 'default' && [
                active
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'text-gray-600 hover:bg-gray-100 border border-transparent',
              ],
              variant === 'pills' && [
                active
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100',
              ],
              variant === 'underline' && [
                'rounded-none',
                active
                  ? 'text-primary-700 border-b-2 border-primary-600 -mb-px'
                  : 'text-gray-600 hover:text-primary-600',
              ]
            )}
          >
            <span>{item.label}</span>
            {typeof item.count === 'number' && (
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[1.5rem] px-1.5 h-5 text-xs rounded-full',
                  variant === 'default' && (active ? 'bg-primary-700 text-white' : 'bg-gray-200 text-gray-700'),
                  variant === 'pills' && (active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'),
                  variant === 'underline' && 'bg-gray-200 text-gray-700'
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * TabPanel — da wrappare intorno al contenuto di un tab. Non fa rendering
 * condizionale (lo fa il consumer via `value === x`), ma aggiunge
 * `role="tabpanel"` semantico.
 */
export function TabPanel({
  active,
  children,
  className,
}: {
  active: boolean;
  children: ReactNode;
  className?: string;
}) {
  if (!active) return null;
  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}
