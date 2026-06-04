import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Registrati a KYKOS",
  description:
    "Registrati a KYKOS come donatore o beneficiario. Donazione anonima, enti fidati come Caritas e parrocchie, solidarietà.",
  keywords: [
    "registrati KYKOS",
    "registrazione donazione",
    "registrazione beneficiario",
    "donazione anonima",
    "Caritas",
    "parrocchia",
    "solidarietà",
  ],
  alternates: {
    canonical: "https://kykos.it/auth/register",
  },
  openGraph: {
    title: "Registrati a KYKOS",
    description: "Registrati a KYKOS come donatore o beneficiario. Donazione anonima, enti fidati, solidarietà.",
    type: "website",
    url: "https://kykos.it/auth/register",
    siteName: "KYKOS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Registrati a KYKOS - Dona con amore, ricevi con dignità",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Registrati a KYKOS",
    description: "Registrati a KYKOS come donatore o beneficiario. Donazione anonima, enti fidati, solidarietà.",
    images: ["/og-image.png"],
  },
};

const registerJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Registrati a KYKOS",
  description: "Pagina di registrazione a KYKOS come donatore o beneficiario.",
  url: "https://kykos.it/auth/register",
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

const registerBreadcrumb = {
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
      name: "Registrati",
      item: "https://kykos.it/auth/register",
    },
  ],
};

export default function AuthRegisterLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={[registerJsonLd, registerBreadcrumb]} />
      {children}
    </>
  );
}
