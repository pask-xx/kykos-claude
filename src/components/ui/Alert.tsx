'use client';

import { HTMLAttributes, ReactNode, forwardRef } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Alert primitive — banner con icona e titolo opzionale.
 * Default icon è emoji Unicode; passa `icon` per sovrascrivere con lucide.
 *
 * Esempi:
 *   <Alert type="error">Email già registrata</Alert>
 *   <Alert type="success" title="Salvato">Le modifiche sono state applicate.</Alert>
 *   <Alert type="warning" icon={<AlertTriangle />} title="Attenzione">…</Alert>
 */

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  /** Icona opzionale (lucide React). Se omessa, usa un'emoji di default. */
  icon?: ReactNode;
}

const typeClasses = {
  success: {
    container: 'bg-success-50 border-success-200 text-success-700',
    defaultIcon: '✓',
    iconColor: 'text-success-600',
    titleColor: 'text-success-800',
  },
  error: {
    container: 'bg-error-50 border-error-200 text-error-700',
    defaultIcon: '✕',
    iconColor: 'text-error-600',
    titleColor: 'text-error-800',
  },
  warning: {
    container: 'bg-warning-50 border-warning-200 text-warning-700',
    defaultIcon: '⚠',
    iconColor: 'text-warning-600',
    titleColor: 'text-warning-800',
  },
  info: {
    container: 'bg-info-50 border-info-200 text-info-700',
    defaultIcon: 'ℹ',
    iconColor: 'text-info-600',
    titleColor: 'text-info-800',
  },
};

// Icone lucide di default, riusate se `icon` non è passato.
const defaultLucideIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, type = 'info', title, icon, children, ...props }, ref) => {
    const styles = typeClasses[type];
    const LucideIcon = defaultLucideIcons[type];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn('flex items-start gap-3 p-4 rounded-lg border', styles.container, className)}
        {...props}
      >
        {icon ?? (
          <LucideIcon
            className={cn('h-5 w-5 flex-shrink-0 mt-0.5', styles.iconColor)}
            aria-hidden="true"
          />
        )}
        <div className="flex-1 text-sm">
          {title && <p className={cn('font-semibold mb-1', styles.titleColor)}>{title}</p>}
          <div>{children}</div>
        </div>
      </div>
    );
  }
);
Alert.displayName = 'Alert';
