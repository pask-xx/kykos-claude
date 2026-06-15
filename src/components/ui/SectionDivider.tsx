'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * <SectionDivider> — divisorio di sezione "label + linea colorata".
 *
 * Usato per separare visivamente 2 categorie binarie complementari in una
 * lista (es. "In attesa" + "Autorizzati"), in alternativa al componente
 * <Tabs> che mostra una sola categoria alla volta.
 *
 * Pattern:
 * - Label bold uppercase a sx, count tra parentesi in font-normal.
 * - Linea colorata che si estende a dx (flex-1) per riempire lo spazio.
 * - Token semantici del design system (warning/success).
 * - a11y: la linea è aria-hidden (decorativa), il label è il significato.
 *
 * NON gestisce collassamento: per una sezione collassabile, wrappare
 * l'intero blocco in <Accordion>.
 *
 * Esempio:
 *   <SectionDivider label="In attesa" count={3} color="warning" />
 *   {pending.map(item => <Card key={item.id} {...item} />)}
 */
export interface SectionDividerProps {
  label: string;
  count: number;
  color: 'warning' | 'success' | 'info' | 'primary';
  className?: string;
  children?: ReactNode; // per iniettare azioni aggiuntive (es. bottone)
}

const COLOR_CLASSES: Record<SectionDividerProps['color'], { line: string; text: string }> = {
  warning: { line: 'bg-warning-300', text: 'text-warning-700' },
  success: { line: 'bg-success-300', text: 'text-success-700' },
  info: { line: 'bg-info-300', text: 'text-info-700' },
  primary: { line: 'bg-primary-300', text: 'text-primary-700' },
};

export function SectionDivider({ label, count, color, className, children }: SectionDividerProps) {
  const colorClass = COLOR_CLASSES[color];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <h2 className={cn('text-sm font-bold uppercase tracking-wide', colorClass.text)}>
        {label} <span className="font-normal">({count})</span>
      </h2>
      <div className={cn('flex-1 h-px', colorClass.line)} aria-hidden="true" />
      {children}
    </div>
  );
}
