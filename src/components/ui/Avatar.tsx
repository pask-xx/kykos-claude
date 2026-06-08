import { ImgHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Avatar primitive — immagine profilo, con fallback a iniziali.
 * Stile coerente con Sidebar/OperatorSidebar (`w-10 h-10 rounded-full bg-primary-100`).
 *
 * Esempio:
 *   <Avatar src={user.photoUrl} name="Mario Rossi" size="md" />
 *   <Avatar
 *     src={user.photoUrl}
 *     name="Mario Rossi"           // aria-label (nome completo, per screen reader)
 *     fallbackName="M"            // lettera mostrata nell'avatar
 *     size="md"
 *   />
 *   <AvatarGroup>
 *     <Avatar src={u1.photoUrl} name="Mario" />
 *     <Avatar src={u2.photoUrl} name="Luigi" />
 *   </AvatarGroup>
 *
 * Caso d'uso: per i beneficiari street, vogliamo mostrare la lettera del
 * NICKNAME (identificativo pubblico) ma rendere disponibile il nome
 * completo agli screen reader. `name` è l'etichetta semantica, `fallbackName`
 * è il testo visibile.
 */

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
} as const;

export type AvatarSize = keyof typeof sizeMap;

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  name: string;
  /** Testo mostrato nell'avatar quando manca src. Default: iniziali di `name`. */
  fallbackName?: string;
  size?: AvatarSize;
}

export const Avatar = forwardRef<HTMLImageElement, AvatarProps>(
  ({ src, name, fallbackName, size = 'md', alt, className, ...props }, ref) => {
    const sizeClass = sizeMap[size];

    if (!src) {
      const display = fallbackName
        ? fallbackName.trim().slice(0, 2).toUpperCase()
        : getInitials(name);
      return (
        <div
          className={cn(
            'rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center select-none',
            sizeClass,
            className
          )}
          aria-label={name}
          role="img"
        >
          {display}
        </div>
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={ref}
        src={src}
        alt={alt ?? name}
        className={cn('rounded-full object-cover', sizeClass, className)}
        {...props}
      />
    );
  }
);
Avatar.displayName = 'Avatar';

export function AvatarGroup({
  children,
  max = 4,
}: {
  children: React.ReactNode;
  max?: number;
}) {
  const arr = Array.isArray(children) ? children : [children];
  const visible = arr.slice(0, max);
  const overflow = arr.length - max;

  return (
    <div className="flex -space-x-2">
      {visible}
      {overflow > 0 && (
        <div
          className="h-10 w-10 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center border-2 border-white"
          aria-label={`+${overflow} altri`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
