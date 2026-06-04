'use client';

import {
  ReactNode,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  useId,
} from 'react';
import {
  FormProvider,
  useFormContext,
  useForm,
  UseFormProps,
  UseFormReturn,
  FieldValues,
  FieldErrors,
  Path,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';

/**
 * Form primitive — wrapper su react-hook-form + zod.
 *
 * Esempio (sostituisce il pattern attuale con 8-15 useState per form):
 *   const schema = z.object({
 *     email: z.string().email(),
 *     password: z.string().min(6),
 *   });
 *
 *   function MyForm() {
 *     const methods = useForm({ resolver: zodResolver(schema) });
 *     const onSubmit = async (data) => {
 *       await fetch('/api/...', { method: 'POST', body: JSON.stringify(data) });
 *       toast.success('Salvato');
 *     };
 *     return (
 *       <Form methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
 *         <Field name="email" label="Email" type="email" required />
 *         <Field name="password" label="Password" type="password" required />
 *         <Button type="submit" loading={methods.formState.isSubmitting}>Salva</Button>
 *       </Form>
 *     );
 *   }
 *
 * Vantaggi:
 *  - validazione tipata con zod (errors tipizzati)
 *  - niente 8-15 useState per form
 *  - errori per campo gestiti automaticamente da <Field>
 *  - submit reentrancy-safe (isSubmitting)
 */

export interface FormProps<T extends FieldValues> {
  methods: UseFormReturn<T>;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
  children: ReactNode;
  className?: string;
}

export function Form<T extends FieldValues>({ methods, onSubmit, children, className }: FormProps<T>) {
  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className={cn('space-y-4', className)} noValidate>
        {children}
      </form>
    </FormProvider>
  );
}

// Convenient hook: crea un useForm già tipizzato sullo schema zod.
// Limitato a z.ZodObject<any> (lo schema più comune) per evitare attriti
// di TypeScript con FieldValues. Per altri schemi, usa direttamente
// useForm + zodResolver.
export function useZodForm<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
  options?: Omit<UseFormProps<z.infer<T>>, 'resolver'>
) {
  return useForm<z.infer<T>>({
    ...(options ?? {}),
    resolver: zodResolver(schema) as never,
  });
}

// ===================
// Field — input collegato a react-hook-form
// ===================

export interface FieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'defaultValue'> {
  name: string;
  label: string;
  hint?: string;
}

export const Field = ({
  name,
  label,
  hint,
  className,
  id,
  ...props
}: FieldProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const reactId = useId();
  const inputId = id ?? `f-${name}-${reactId}`;
  const error = errors[name]?.message as string | undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
        {props.required && <span className="text-error-500 ml-1">*</span>}
      </label>
      <input
        id={inputId}
        className={cn(
          'w-full px-3 py-2.5 border rounded-lg outline-none transition text-sm',
          'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          error ? 'border-error-500' : 'border-gray-300',
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...register(name)}
        {...props}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-error-600">
          {error}
        </p>
      )}
    </div>
  );
};
Field.displayName = 'Field';

// ===================
// TextAreaField
// ===================

export interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name' | 'defaultValue'> {
  name: string;
  label: string;
  hint?: string;
}

export const TextAreaField = ({
  name,
  label,
  hint,
  className,
  id,
  ...props
}: TextAreaFieldProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const reactId = useId();
  const inputId = id ?? `f-${name}-${reactId}`;
  const error = errors[name]?.message as string | undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
        {props.required && <span className="text-error-500 ml-1">*</span>}
      </label>
      <textarea
        id={inputId}
        className={cn(
          'w-full px-3 py-2.5 border rounded-lg outline-none transition text-sm resize-none',
          'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          error ? 'border-error-500' : 'border-gray-300',
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        {...register(name)}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-error-600">{error}</p>}
    </div>
  );
};
TextAreaField.displayName = 'TextAreaField';

// ===================
// SelectField
// ===================

export interface SelectFieldOption {
  value: string;
  label: string;
}

export interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name' | 'defaultValue'> {
  name: string;
  label: string;
  options: SelectFieldOption[];
  hint?: string;
  placeholder?: string;
}

export const SelectField = ({
  name,
  label,
  hint,
  options,
  placeholder,
  className,
  id,
  ...props
}: SelectFieldProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const reactId = useId();
  const inputId = id ?? `f-${name}-${reactId}`;
  const error = errors[name]?.message as string | undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
        {props.required && <span className="text-error-500 ml-1">*</span>}
      </label>
      <select
        id={inputId}
        className={cn(
          'w-full px-3 py-2.5 border rounded-lg outline-none transition text-sm bg-white',
          'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          error ? 'border-error-500' : 'border-gray-300',
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        {...register(name)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-error-600">{error}</p>}
    </div>
  );
};
SelectField.displayName = 'SelectField';

// Re-exports per ridurre import verbosi nei consumer
export { useForm, useFormContext };
export type { FieldErrors, Path };
