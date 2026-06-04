import { Button } from './Button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Pagination primitive — paginazione numerata o semplice prev/next.
 * Default: variant "numbered" mostra 1-2-3-...-N con bottoni quadrati 32x32.
 *
 * Per liste molto grandi è preferibile usare la paginazione infinita
 * (DonorRequestsClient) o cursor-based; Pagination è per i casi con N pagine noto.
 *
 * Esempio:
 *   <Pagination
 *     page={page}
 *     totalPages={10}
 *     onPageChange={setPage}
 *   />
 */

export interface PaginationProps {
  page: number; // 1-based
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number; // quante pagine mostrare a lato della corrente, default 1
  variant?: 'numbered' | 'simple';
}

function getPageRange(current: number, total: number, siblingCount: number): (number | 'ellipsis')[] {
  const totalNumbers = siblingCount * 2 + 5; // first, last, current, 2 ellipsis, siblings

  if (total <= totalNumbers) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, total);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  const range: (number | 'ellipsis')[] = [];

  // first
  range.push(1);
  // left ellipsis
  if (showLeftEllipsis) range.push('ellipsis');
  // siblings + current
  for (let i = leftSibling; i <= rightSibling; i++) {
    if (i !== 1 && i !== total) range.push(i);
  }
  // right ellipsis
  if (showRightEllipsis) range.push('ellipsis');
  // last
  if (total > 1) range.push(total);

  return range;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  variant = 'numbered',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  if (variant === 'simple') {
    return (
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Precedente
        </Button>
        <span className="text-sm text-gray-600">
          Pagina {page} di {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Successiva
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const range = getPageRange(page, totalPages, siblingCount);

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Paginazione">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(1)}
        disabled={page <= 1}
        aria-label="Prima pagina"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Pagina precedente"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {range.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e-${i}`} className="px-2 text-gray-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Pagina ${p}`}
            className={[
              'h-8 w-8 inline-flex items-center justify-center rounded-lg text-sm font-medium transition',
              p === page
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100',
            ].join(' ')}
          >
            {p}
          </button>
        )
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Pagina successiva"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        disabled={page >= totalPages}
        aria-label="Ultima pagina"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
