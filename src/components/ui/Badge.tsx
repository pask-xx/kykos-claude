'use client';

import { HTMLAttributes, forwardRef } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  pill?: boolean;
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
};

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-0.5 text-xs',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', size = 'md', pill = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center font-medium
          ${pill ? 'rounded-full' : 'rounded'}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
