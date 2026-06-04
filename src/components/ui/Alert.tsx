'use client';

import { HTMLAttributes, forwardRef } from 'react';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
}

const typeClasses = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-700',
    icon: '✓',
    iconColor: 'text-green-600',
    titleColor: 'text-green-800',
    textColor: 'text-green-700',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-700',
    icon: '✕',
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
    textColor: 'text-red-700',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-700',
    icon: '⚠',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-800',
    textColor: 'text-amber-700',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-700',
    icon: 'ℹ',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-800',
    textColor: 'text-blue-700',
  },
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className = '', type = 'info', title, children, ...props }, ref) => {
    const styles = typeClasses[type];

    return (
      <div
        ref={ref}
        className={`
          flex items-start gap-3 p-4 rounded-lg border
          ${styles.container}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      >
        <span className={`text-lg ${styles.iconColor}`}>{styles.icon}</span>
        <div className="flex-1">
          {title && (
            <p className={`font-semibold mb-1 ${styles.titleColor}`}>{title}</p>
          )}
          <div className={styles.textColor}>
            {children}
          </div>
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';
