import Link from 'next/link';
import { JsonLd } from './JsonLd';

export interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumbs - Componente per visualizzare breadcrumb con JSON-LD automatico.
 *
 * Usato nelle pagine interne (es. FAQ, cookie-policy) per migliorare la SEO
 * con struttura gerarchica chiara. Genera sia HTML visibile che JSON-LD
 * BreadcrumbList.
 */
export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.href.startsWith('http') ? item.href : `https://kykos.it${item.href}`,
    })),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <nav aria-label="Breadcrumb" className={`text-sm text-gray-500 ${className}`}>
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-1">
                {isLast ? (
                  <span className="text-gray-700 font-medium" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link
                      href={item.href}
                      className="hover:text-primary-600 hover:underline transition"
                    >
                      {item.name}
                    </Link>
                    <span aria-hidden="true" className="text-gray-400">
                      /
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
