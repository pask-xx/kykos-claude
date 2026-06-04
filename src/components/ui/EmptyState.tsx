import { ReactNode } from 'react';
import { Inbox, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * EmptyState primitive — da usare quando una lista/sezione è vuota.
 * Default icon: Inbox di lucide-react. Stile: card centrata con icona
 * primary-300 48x48, titolo, descrizione, azione opzionale.
 *
 * Esempio:
 *   <EmptyState
 *     icon={Package}
 *     title="Nessun oggetto"
 *     description="Pubblica il tuo primo oggetto per iniziare."
 *     action={<Button>+ Aggiungi oggetto</Button>}
 *   />
 */

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'text-center py-12 bg-white rounded-xl shadow-sm border',
        className
      )}
    >
      <Icon className="mx-auto h-12 w-12 text-primary-300 mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
