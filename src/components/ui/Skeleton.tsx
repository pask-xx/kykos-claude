import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton primitive — segnaposto animate-pulse per contenuti in caricamento.
 * Stile base: bg-gray-200 animate-pulse rounded.
 *
 * Esempi:
 *   <Skeleton className="h-4 w-32" />           // singolo blocco
 *   <SkeletonText lines={3} />                  // 3 righe di testo
 *   <SkeletonCard />                            // card intero placeholder
 *   <SkeletonAvatar />                          // avatar rotondo 40x40
 */

export const Skeleton = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('bg-gray-200 animate-pulse rounded', className)} {...props} />
);
Skeleton.displayName = 'Skeleton';

export const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className="h-4"
        style={{ width: `${100 - i * 15}%` }}
      />
    ))}
  </div>
);
SkeletonText.displayName = 'SkeletonText';

export const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn('bg-white rounded-xl shadow-sm border p-6 space-y-3', className)}>
    <Skeleton className="h-4 w-1/3" />
    <SkeletonText lines={2} />
  </div>
);
SkeletonCard.displayName = 'SkeletonCard';

export const SkeletonAvatar = ({ size = 40 }: { size?: number }) => (
  <Skeleton
    className="rounded-full"
    style={{ width: size, height: size }}
  />
);
SkeletonAvatar.displayName = 'SkeletonAvatar';
