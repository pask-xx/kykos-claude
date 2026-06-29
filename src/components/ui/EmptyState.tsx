import { isValidElement, ReactNode } from 'react';
import { Inbox, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * EmptyState primitive — da usare quando una lista/sezione è vuota.
 * Default icon: Inbox di lucide-react. Stile: card centrata con icona
 * primary-300 48x48, titolo, descrizione, azione opzionale.
 *
 * **Boundary server/client**: l'icona può essere un componente lucide-react
 * (es. `icon={Package}`, OK da client component) OPPURE un elemento React
 * già istanziato (es. `icon={<Package ... />}`, OK da server component).
 * Stessa logica di `<StatCard>` vedi DESIGN.md §5.18.
 *
 * Esempio:
 *   <EmptyState
 *     icon={<Package className="h-12 w-12 text-primary-300" aria-hidden="true" />}
 *     title="Nessun oggetto"
 *     description="Pubblica il tuo primo oggetto per iniziare."
 *     action={<Button>+ Aggiungi oggetto</Button>}
 *   />
 */

export interface EmptyStateProps {
  /**
   * Icona. Default: Inbox di lucide-react. Accetta componente lucide-react
   * (es. `icon={Package}`) o elemento React (es. `icon={<Package .../>}`).
   */
  icon?: LucideIcon | ReactNode;
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
  // Stessa logica di <StatCard>: elemento → wrappalo, componente → istanzialo
  let renderedIcon: ReactNode;
  if (isValidElement(Icon)) {
    renderedIcon = Icon;
  } else {
    const IconCmp = Icon as LucideIcon;
    renderedIcon = <IconCmp className="mx-auto h-12 w-12 text-primary-300 mb-4" aria-hidden="true" />;
  }

  return (
    <div
      className={cn(
        'text-center py-12 bg-white rounded-xl shadow-sm border',
        className
      )}
    >
      {renderedIcon}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
