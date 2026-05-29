'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2 border rounded-lg
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-offset-0
            placeholder:text-gray-400
            ${error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
            }
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2 border rounded-lg
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-offset-0
            placeholder:text-gray-400 resize-none
            ${error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
            }
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, id, options, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2 border rounded-lg
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
            }
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <label htmlFor={inputId} className={`flex items-center gap-2 cursor-pointer ${className}`}>
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          {...props}
        />
        {label && <span className="text-sm text-gray-700">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
