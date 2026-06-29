'use client';

import { forwardRef, ReactNode, MouseEvent } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface EntityListCardProps {
  /**
   * Contenuto icona (lucide React o <img>).
   * Wrapper bg-gray-100 w-14 h-14 sm:w-16 sm:h-16 è gestito dalla primitive.
   * L'icona stessa DEVE avere `aria-hidden="true"` (regola Fase 21).
   */
  icon: ReactNode;
  /** Titolo principale. Renderizzato come h3 con truncate. */
  title: ReactNode;
  /**
   * Badge (o qualsiasi ReactNode) mostrati a destra del titolo su DESKTOP
   * e sotto al titolo su MOBILE. Tipicamente <Badge> pre-tradotti dal
   * consumer. Se passato, occupa spazio nel layout (vedi §11).
   */
  badgesTop?: ReactNode;
  /** Riga meta subito sotto il titolo (es. "Richiesta da mario • 1g"). */
  meta?: ReactNode;
  /** Descrizione 1-2 righe. La primitive applica line-clamp-2. */
  description?: ReactNode;
  /**
   * Se passato, la card è navigabile (area header wrappata in <Link>).
   * Con `footer`, il footer è FUORI dal link (no e.stopPropagation necessario).
   */
  href?: string;
  /**
   * Callback al click prima della navigazione (es. sessionStorage per backUrl).
   * Viene chiamata DOPO il rendering del link, in modo safe per SSR.
   */
  onNavigate?: () => void;
  /**
   * Slot in fondo alla card (full-width su mobile, inline-right su desktop).
   * Esempio: bottone "Stampa etichetta" su /operator/deposit.
   * Se passato + `href`: header ha il <Link>, footer è separato.
   * Se passato senza `href`: la card non è cliccabile.
   */
  footer?: ReactNode;
  /** Classi extra per il wrapper esterno. */
  className?: string;
  /**
   * Etichetta aria-label per il link wrapper. Default: usa title se è stringa.
   * Importante: passare SEMPRE esplicitamente se il title è JSX complesso.
   */
  ariaLabel?: string;
}

/**
 * <EntityListCard> — card orizzontale cliccabile per liste generiche.
 *
 * Estratta dal pattern di /operator/requests-entity (Fase XYZ) per risolvere
 * il bug mobile "titolo troncato dai badge" e allineare il pattern grafico
 * con <DonorCard> (Fase XYZ) e <ExpandableObjectCard> (Fase 34.2).
 *
 * **Layout responsive** (FIX del bug originale):
 * - Mobile (< 640px): header `flex-col` — titolo su riga 1, badgesTop su riga 2.
 * - Desktop (≥ 640px): header `flex-row justify-between` — titolo a sx, badgesTop a dx.
 * - `flex-wrap` interno al container badge: se sono troppi, vanno a capo
 *   (comportamento voluto, NON come il vecchio pattern con `flex-shrink-0`
 *   che spingeva il titolo fuori).
 * - `min-w-0` sul titolo: NECESSARIO per far funzionare `truncate` in un
 *   flex container (regola CSS standard).
 *
 * **Comportamento wrapper**:
 * - `footer` + `href`: wrapper `<article>`, area header (icona + titolo +
 *   badgesTop + meta + description) wrappata in <Link>, footer FUORI dal link.
 *   Risolve sia l'a11y (focus semanticamente corretto) sia il problema
 *   "click su button dentro <a> che naviga".
 * - Solo `href`: wrapper `<Link>` con `onClick={onNavigate}`.
 * - Solo `footer` (no href): wrapper `<article>`, no hover, no cursor.
 * - Nessuno dei due: wrapper `<div>`, card statica.
 *
 * **Accessibilità** (regole 01-core-principles + 05-known-issues Fase 21-22):
 * - Icona SEMPRE `aria-hidden="true"` (responsabilità del consumer).
 * - Link con `aria-label` calcolato: `ariaLabel ?? (typeof title === 'string' ? title : undefined)`.
 * - Focus ring sul Link: `focus-visible:ring-2 focus-visible:ring-primary-500
 *   focus-visible:ring-offset-2 rounded-xl` (stessa convenzione di <DonorCard>).
 * - Footer slot: il consumer DEVE usare primitive accessibili (Button/Link).
 *   MAI `<div onClick>` (vietato da §11).
 *
 * **Anonymity**: la primitive NON gestisce nomi di controparte. Il consumer
 * passa già i dati anonimizzati. È uno slot composition, "stupida" rispetto
 * ai dati.
 *
 * **Esempi** (vedi refactor-state per i call site reali):
 *   <EntityListCard
 *     icon={<Package aria-hidden="true" />}
 *     title={obj.title}
 *     badgesTop={<Badge>Disponibile</Badge>}
 *     meta={`${category} • ${date}`}
 *     href={`/operator/objects/${obj.id}`}
 *   />
 */
export const EntityListCard = forwardRef<HTMLDivElement, EntityListCardProps>(
  function EntityListCard(
    {
      icon,
      title,
      badgesTop,
      meta,
      description,
      href,
      onNavigate,
      footer,
      className,
      ariaLabel,
    },
    ref,
  ) {
    const computedAriaLabel = ariaLabel ?? (typeof title === 'string' ? title : undefined);

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
      onNavigate?.();
      // Non blocchiamo la navigazione: Next.js Link gestisce il resto.
      void e;
    };

    // Contenuto della card (riusato in tutte le varianti wrapper)
    const cardContent = (
      <div className="flex gap-3 sm:gap-4">
        {/* Icona wrapper — dimensione fissa su tutti i breakpoint */}
        <div
          className={cn(
            'w-14 h-14 sm:w-16 sm:h-16',
            'bg-gray-100 rounded-lg',
            'flex items-center justify-center flex-shrink-0',
            'overflow-hidden',
          )}
        >
          {icon}
        </div>

        {/* Colonna destra */}
        <div className="flex-1 min-w-0">
          {/* Riga header: titolo + badgesTop
              MOBILE: flex-col (titolo su riga 1, badgesTop sotto).
              DESKTOP: flex-row justify-between (badgesTop a destra). */}
          <div
            className={cn(
              'flex flex-col sm:flex-row sm:items-start sm:justify-between',
              'gap-1 sm:gap-3',
            )}
          >
            <h3 className="font-semibold text-gray-900 truncate min-w-0">{title}</h3>
            {badgesTop && (
              <div className="flex flex-wrap items-center gap-1.5 sm:flex-shrink-0">
                {badgesTop}
              </div>
            )}
          </div>

          {meta && <div className="text-sm text-gray-500 mt-1">{meta}</div>}

          {description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{description}</p>
          )}
        </div>
      </div>
    );

    // Footer slot wrapper (full-width su mobile, inline-right su desktop)
    const footerContent = footer && (
      <div className="mt-3 flex justify-stretch sm:justify-end">{footer}</div>
    );

    // === VARIANTI WRAPPER ===

    // Caso 1: footer + href → <article> + <Link> interno (header) + footer esterno
    if (footer && href) {
      return (
        <article
          ref={ref}
          className={cn(
            'bg-white rounded-xl shadow-sm border p-4',
            className,
          )}
        >
          <Link
            href={href}
            onClick={onNavigate}
            aria-label={computedAriaLabel}
            className={cn(
              'block rounded-lg',
              'hover:border-primary-300 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            )}
          >
            {cardContent}
          </Link>
          {footerContent}
        </article>
      );
    }

    // Caso 2: solo href → wrapper <Link> unico
    if (href) {
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          onClick={handleClick}
          aria-label={computedAriaLabel}
          className={cn(
            'block bg-white rounded-xl shadow-sm border p-4',
            'hover:border-primary-300 transition-colors cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            className,
          )}
        >
          {cardContent}
        </Link>
      );
    }

    // Caso 3: solo footer o niente di navigabile → wrapper <article>/<div>
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-xl shadow-sm border p-4',
          className,
        )}
      >
        {cardContent}
        {footerContent}
      </div>
    );
  },
);
