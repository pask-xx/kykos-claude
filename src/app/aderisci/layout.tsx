import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "ADERISCI - KYKOS",
  description: "Scopri come aderire a KYKOS per donare oggetti a persone bisognose in modo anonimo.",
  keywords: ["aderisci KYKOS", "donare oggetti", "donazione anonima", "solidarietà"],
  alternates: {
    canonical: "https://kykos.it/aderisci",
  },
  openGraph: {
    title: "ADERISCI - KYKOS",
    description: "Scopri come aderire a KYKOS per donare oggetti a persone bisognose in modo anonimo.",
    type: "website",
    url: "https://kykos.it/aderisci",
    siteName: "KYKOS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KYKOS - Aderisci",
      },
    ],
  },
};

const aderisciJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Aderisci a KYKOS",
  description: "Unisciti alla rete di solidarietà KYKOS per donare o ricevere oggetti in modo anonimo.",
  url: "https://kykos.it/aderisci",
  inLanguage: "it-IT",
  isPartOf: {
    "@type": "WebSite",
    name: "KYKOS",
    url: "https://kykos.it",
  },
  potentialAction: {
    "@type": "RegisterAction",
    target: "https://kykos.it/auth/register",
    name: "Registrati a KYKOS",
  },
};

export default function AderisciLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={aderisciJsonLd} />
      {children}
    </>
  );
}
