import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Adesione - KYKOS",
  description: "Richiedi l'adesione a KYKOS come intermediario. Dona con amore, ricevi con dignità.",
  keywords: ["adesione KYKOS", "diventa intermediario", "donazione anonima", "Caritas", "parrocchia"],
  alternates: {
    canonical: "https://kykos.it/adesione",
  },
  openGraph: {
    title: "Adesione - KYKOS",
    description: "Richiedi l'adesione a KYKOS come intermediario. Dona con amore, ricevi con dignità.",
    type: "website",
    url: "https://kykos.it/adesione",
    siteName: "KYKOS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KYKOS - Adesione",
      },
    ],
  },
};

const adesioneJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Adesione al network KYKOS",
  description: "Richiedi l'adesione a KYKOS come ente intermediario (Caritas, parrocchia, associazione).",
  url: "https://kykos.it/adesione",
  inLanguage: "it-IT",
  isPartOf: {
    "@type": "WebSite",
    name: "KYKOS",
    url: "https://kykos.it",
  },
  publisher: {
    "@type": "Organization",
    name: "KYKOS",
    url: "https://kykos.it",
  },
};

const adesioneBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://kykos.it",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Adesione",
      item: "https://kykos.it/adesione",
    },
  ],
};

export default function AdesioneLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={[adesioneJsonLd, adesioneBreadcrumb]} />
      {children}
    </>
  );
}
