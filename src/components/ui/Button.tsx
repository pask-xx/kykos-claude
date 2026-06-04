'use client';

import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { Spinner } from './Spinner';
import { cn } from '@/lib/utils';

/**
 * Button primitive — pulsante standard KYKOS con varianti semantiche,
 * taglie, loading state, e icone left/right (lucide-friendly).
 *
 * Varianti:
 *  - primary: azione principale (sfondo primary-600)
 *  - secondary: azione secondaria (grigio neutro)
 *  - danger: azione distruttiva (red-600)
 *  - warning: azione di attenzione (amber-600)
 *  - ghost: azione terziaria, senza sfondo
 *  - success: azione positiva (green-600, usata per "Approva")
 *
 * Esempi:
 *   <Button>Salva</Button>
 *   <Button variant="danger" onClick={onDelete}>Elimina</Button>
 *   <Button leftIcon={<Plus />} loading={isSubmitting}>Aggiungi</Button>
 *   <Button variant="ghost" rightIcon={<ChevronRight />}>Avanti</Button>
 */

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClasses = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300',
  danger: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500',
  warning: 'bg-warning-600 text-white hover:bg-warning-700 focus:ring-warning-500',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
  success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          'rounded-lg font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" className="border-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);
Button.displayName = 'Button';
