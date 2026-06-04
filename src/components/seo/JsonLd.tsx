/**
 * JsonLd - Helper per iniettare dati strutturati JSON-LD in pagine Server Component.
 *
 * Usato per migliorare la SEO con rich snippet (FAQ, Organization, Article, ecc.).
 * Accetta un singolo oggetto o un array di oggetti schema.org.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // I dati JSON-LD sono costruiti a partire da costanti statiche (mai input utente)
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
