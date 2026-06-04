'use client';

import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Table primitive — wrapper semantico su <table> con stile condiviso KYKOS.
 * Stile di riferimento: `operator/operators/page.tsx`, `intermediary/recipients/page.tsx`.
 *
 * Default look: container `bg-white rounded-xl shadow-sm border overflow-hidden`,
 * header `bg-gray-50`, `divide-y divide-gray-200` sulle righe, hover opzionale.
 *
 * Esempio:
 *   <Table hoverable>
 *     <TableHeader>
 *       <TableRow>
 *         <TableHead>Nome</TableHead>
 *         <TableHead>Email</TableHead>
 *       </TableRow>
 *     </TableHeader>
 *     <TableBody>
 *       <TableRow>
 *         <TableCell>Mario</TableCell>
 *         <TableCell>mario@email.com</TableCell>
 *       </TableRow>
 *     </TableBody>
 *   </Table>
 */

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  hoverable?: boolean;
  striped?: boolean;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, hoverable = true, ...props }, ref) => (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <table
        ref={ref}
        className={cn('w-full', hoverable && '[&_tbody_tr:hover]:bg-gray-50', className)}
        {...props}
      />
    </div>
  )
);
Table.displayName = 'Table';

export const TableHeader = ({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn('bg-gray-50 border-b', className)} {...props} />
);
TableHeader.displayName = 'TableHeader';

export const TableBody = ({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn('divide-y divide-gray-200', className)} {...props} />
);
TableBody.displayName = 'TableBody';

export const TableRow = ({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn('', className)} {...props} />
);
TableRow.displayName = 'TableRow';

export const TableHead = ({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn('px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider', className)}
    {...props}
  />
);
TableHead.displayName = 'TableHead';

export const TableCell = ({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn('px-4 py-3 text-sm text-gray-900', className)} {...props} />
);
TableCell.displayName = 'TableCell';

export const TableEmpty = ({
  colSpan,
  children,
}: {
  colSpan: number;
  children: ReactNode;
}) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-gray-500">
      {children}
    </td>
  </tr>
);
TableEmpty.displayName = 'TableEmpty';
