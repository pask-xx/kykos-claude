'use client';

import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

/**
 * Toast primitive — wrapper su `sonner` configurato con i colori KYKOS.
 *
 * Da mountare UNA volta in `src/app/layout.tsx`:
 *   import { ToastProvider } from '@/components/ui/Toast';
 *   ...
 *   <body>
 *     {children}
 *     <ToastProvider />
 *   </body>
 *
 * Da usare nelle pagine:
 *   import { toast } from '@/components/ui/Toast';
 *   toast.success('Operazione completata');
 *   toast.error('Errore di rete');
 *   toast.loading('Salvataggio in corso...');
 *   toast.dismiss(); // chiude tutti
 *
 * Sostituisce il pattern attuale:
 *   const [success, setSuccess] = useState(false);
 *   setTimeout(() => setSuccess(false), 3000);
 * E le 10 chiamate a `window.alert()` sparse nel codice.
 */

export function ToastProvider() {
  return (
    <SonnerToaster
      position="top-right"
      richColors={false}
      closeButton
      duration={5000}
      toastOptions={{
        classNames: {
          toast:
            'group toast bg-white border border-gray-200 text-gray-900 shadow-lg rounded-lg',
          description: 'text-gray-600',
          actionButton: 'bg-primary-600 text-white',
          cancelButton: 'bg-gray-100 text-gray-700',
          success: 'border-l-4 border-l-success-500',
          error: 'border-l-4 border-l-error-500',
          warning: 'border-l-4 border-l-warning-500',
          info: 'border-l-4 border-l-info-500',
        },
      }}
      icons={{
        success: <CheckCircle2 className="h-5 w-5 text-success-600" />,
        error: <AlertCircle className="h-5 w-5 text-error-600" />,
        warning: <AlertTriangle className="h-5 w-5 text-warning-600" />,
        info: <Info className="h-5 w-5 text-info-600" />,
        close: <X className="h-4 w-4" />,
      }}
    />
  );
}

// Re-export dell'API sonner con API KYKOS-friendly
export const toast = {
  success: (message: string, opts?: Parameters<typeof sonnerToast.success>[1]) =>
    sonnerToast.success(message, opts),
  error: (message: string, opts?: Parameters<typeof sonnerToast.error>[1]) =>
    sonnerToast.error(message, opts),
  warning: (message: string, opts?: Parameters<typeof sonnerToast.warning>[1]) =>
    sonnerToast.warning(message, opts),
  info: (message: string, opts?: Parameters<typeof sonnerToast.info>[1]) =>
    sonnerToast.info(message, opts),
  loading: (message: string, opts?: Parameters<typeof sonnerToast.loading>[1]) =>
    sonnerToast.loading(message, opts),
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
};
