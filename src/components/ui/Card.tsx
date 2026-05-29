'use client';

import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', padding = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          bg-white rounded-xl shadow-sm
          ${variant === 'bordered' ? 'border border-gray-200' : 'border'}
          ${paddingClasses[padding]}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`mb-4 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <h3 ref={ref} className={`text-lg font-semibold text-gray-900 ${className}`} {...props}>
        {children}
      </h3>
    );
  }
);

CardTitle.displayName = 'CardTitle';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';
