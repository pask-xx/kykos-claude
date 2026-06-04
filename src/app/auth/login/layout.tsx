import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Accedi a KYKOS",
  description:
    "Accedi al tuo account KYKOS per donare o ricevere oggetti in modo anonimo. Donazione anonima, enti fidati, solidarietà.",
  keywords: ["login KYKOS", "accedi KYKOS", "donazione anonima", "solidarietà"],
  alternates: {
    canonical: "https://kykos.it/auth/login",
  },
  openGraph: {
    title: "Accedi a KYKOS",
    description: "Accedi al tuo account KYKOS per donare o ricevere oggetti in modo anonimo.",
    type: "website",
    url: "https://kykos.it/auth/login",
    siteName: "KYKOS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KYKOS - Dona con amore, ricevi con dignità",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Accedi a KYKOS",
    description: "Accedi al tuo account KYKOS per donare o ricevere oggetti in modo anonimo.",
    images: ["/og-image.png"],
  },
};

const loginJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Accedi a KYKOS",
  description: "Pagina di accesso al tuo account KYKOS per donare o ricevere oggetti in modo anonimo.",
  url: "https://kykos.it/auth/login",
  inLanguage: "it-IT",
  isPartOf: {
    "@type": "WebSite",
    name: "KYKOS",
    url: "https://kykos.it",
  },
};

const loginBreadcrumb = {
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
      name: "Accedi",
      item: "https://kykos.it/auth/login",
    },
  ],
};

export default function AuthLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={[loginJsonLd, loginBreadcrumb]} />
      {children}
    </>
  );
}
